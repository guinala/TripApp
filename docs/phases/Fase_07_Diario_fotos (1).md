# Fase 7 — Diario de fotos

## Objetivo

Permitir subir fotos al viaje desde cámara o galería, asociarlas a días concretos, añadirles caption y ubicación, y visualizarlas en grid o timeline.

## Prerrequisitos

- Fase 6 completada.
- Bucket `trip-photos` creado en Fase 1 con políticas RLS.

## Tareas

### 7.1 Permisos en `app.json`

Añadir las descripciones de uso (obligatorias en iOS, recomendadas en Android):

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Necesitamos acceso a tus fotos para añadirlas al diario del viaje.",
          "cameraPermission": "Necesitamos acceso a la cámara para que puedas tomar fotos del viaje."
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Usamos tu ubicación para geolocalizar las fotos del diario."
        }
      ]
    ]
  }
}
```

### 7.2 Modelo Photo + servicio

`src/types/photo.ts`:
```typescript
export interface Photo {
  id: string;
  tripId: string;
  dayId: string | null;
  uri: string;             // ruta dentro del bucket
  caption: string | null;
  location: { lat: number; lng: number } | null;
  takenAt: string;
}
```

`src/services/photos.ts`:
- `listPhotos(tripId)`
- `uploadPhoto(tripId, dayId, file, metadata)` — sube a Storage + crea fila.
- `updatePhoto(id, data)`
- `deletePhoto(id)` — borra fila Y archivo del bucket.
- `getSignedUrl(uri)` — genera URL firmada para visualizar (los archivos son privados).

### 7.3 Subida de foto

`src/utils/photoUpload.ts`:

```typescript
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../services/supabase';

export async function pickAndUploadPhoto(tripId: string, dayId: string | null) {
  // 1. Pedir permisos y abrir picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.9,
    exif: true,
  });
  if (result.canceled) return;

  const asset = result.assets[0];

  // 2. Comprimir si es muy grande
  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: 1600 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );

  // 3. Generar path: {user_id}/{trip_id}/{timestamp}.jpg
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user!.id;
  const filename = `${Date.now()}.jpg`;
  const path = `${userId}/${tripId}/${filename}`;

  // 4. Leer como base64 y subir
  const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const arrayBuffer = decode(base64); // helper de base64-arraybuffer

  const { error } = await supabase.storage
    .from('trip-photos')
    .upload(path, arrayBuffer, { contentType: 'image/jpeg' });
  if (error) throw error;

  // 5. Extraer metadata
  const location = asset.exif?.GPSLatitude && asset.exif?.GPSLongitude
    ? { lat: asset.exif.GPSLatitude, lng: asset.exif.GPSLongitude }
    : null;

  // 6. Crear fila en photos
  await supabase.from('photos').insert({
    trip_id: tripId,
    day_id: dayId,
    uri: path,
    location,
    taken_at: asset.exif?.DateTimeOriginal ?? new Date().toISOString(),
  });
}
```

Instalar el helper:
```bash
npm install base64-arraybuffer
```

### 7.4 Tomar foto con la cámara

Igual que el picker pero con `ImagePicker.launchCameraAsync(...)`. Mismo flujo después.

### 7.5 Pantalla de Diario

`app/(app)/trips/[id]/diary.tsx`:

Toggle arriba a la derecha: **Grid** / **Timeline**.

**Vista Grid:**
- 3 columnas (en móvil), tap → abre fullscreen.
- Agrupado por día (igual que itinerario).
- Si un día no tiene fotos, mostrarlo igual pero vacío con botón "+ Foto".

**Vista Timeline:**
- Una foto por fila a ancho completo.
- Caption debajo.
- Fecha y ubicación a la izquierda de la imagen.
- Estilo "Instagram feed".

### 7.6 Visor a pantalla completa

`app/(app)/trips/[id]/photo/[photoId].tsx`:
- Imagen a pantalla completa, fondo negro.
- Swipe horizontal para cambiar de foto (`react-native-pager-view`).
- Pinch-to-zoom (`react-native-image-zoom-viewer` o equivalente).
- Caption editable abajo.
- Botones: compartir, eliminar.

### 7.7 Caché de URLs firmadas

Las fotos en Storage son privadas, así que cada visualización requiere una signed URL. Esto sería caro si se renovase en cada render. Solución:

`src/hooks/useSignedUrls.ts`:
- Cachea las URLs en un Map con TTL (ej. 1 hora, las signed URLs duran 1h por defecto).
- Batch fetch: una sola llamada `createSignedUrls` para múltiples paths.

```typescript
const { data } = await supabase.storage
  .from('trip-photos')
  .createSignedUrls(paths, 3600);
```

### 7.8 Componente PhotoThumbnail

`src/components/PhotoThumbnail.tsx`:
- Usa `expo-image` (no el `Image` nativo) para caché agresiva y blurhash placeholder.
- Loader shimmer mientras carga.
- Fallback si la signed URL falla.

### 7.9 Edición de caption y ubicación

Al tap en una foto → modal de detalle:
- Caption editable.
- Ubicación: si no la tenía, opción de:
  - "Usar mi ubicación actual" (expo-location).
  - "Buscar en el mapa" (modal con MapView + Places).
- Guardar → `updatePhoto`.

### 7.10 Eliminar foto

Doble paso: borrar fila en `photos` + borrar archivo en Storage.

```typescript
async function deletePhoto(photo: Photo) {
  await supabase.storage.from('trip-photos').remove([photo.uri]);
  await supabase.from('photos').delete().eq('id', photo.id);
}
```

Si la fila se borra pero el archivo no (o viceversa), tendrías huérfanos. Para producción, valdría la pena implementarlo en una Edge Function transaccional.

---

## Decisiones técnicas

1. **Comprimir antes de subir** — fotos del iPhone modernas pueden ocupar 5-10 MB. Resize a 1600px de ancho y 80% calidad → ~500 KB, sin pérdida visible para visualización móvil.
2. **Storage privado + signed URLs** — vs bucket público. Más seguro, te aseguras de que solo el dueño pueda ver sus fotos.
3. **`expo-image` en lugar de `Image`** — caché en disco, blurhash placeholders, mejor rendimiento en listas largas.
4. **Metadata EXIF para ubicación y fecha** — el usuario no tiene que rellenarlo a mano si la cámara lo guardó.
5. **Batch de signed URLs** — N+1 problem evitado.

---

## Verificación / Definition of Done

- [ ] Tomar una foto con la cámara aparece en el diario asociada al día actual.
- [ ] Seleccionar una foto de galería con GPS rellena automáticamente su ubicación.
- [ ] Toggle Grid/Timeline funciona y la transición es fluida.
- [ ] Tap en una foto la abre a pantalla completa con swipe entre fotos.
- [ ] Editar el caption persiste tras cerrar y reabrir.
- [ ] Eliminar una foto la quita de la galería Y del bucket de Storage.
- [ ] Las fotos se cachean: tras visualizarlas una vez, abrirlas de nuevo es instantáneo.

## Siguiente fase

→ [Fase 8 — Explorar](./Fase_08_Explorar.md)
