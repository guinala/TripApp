# Fase 3 — Mis viajes (CRUD básico)

## Objetivo

Construir la navegación principal de la app y la primera pestaña funcional: listar, crear, editar y eliminar viajes, con autocompletado de destinos vía Google Places.

## Prerrequisitos

- Fase 2 completada (authStore funcional, sesión persistida).
- API Key de Google Places (Google Cloud Console → habilitar **Places API**).

## Tareas

### 3.1 Estructura de navegación con Expo Router

La estructura de navegación ya está dibujada por carpetas y layouts (la creamos en Fase 1 y los layouts de auth/app en Fase 2). En esta fase rellenamos los layouts y pantallas que faltan.

`app/(app)/(tabs)/_layout.tsx` — las 3 tabs inferiores:

```tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mis viajes',
          tabBarIcon: ({ color, size }) => <Ionicons name="airplane" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
```

Pantallas placeholder para las dos tabs que aún no toca implementar:

`app/(app)/(tabs)/explore.tsx`:
```tsx
import { Text, View } from 'react-native';
export default function ExploreScreen() {
  return <View><Text>Explorar (Fase 8)</Text></View>;
}
```

`app/(app)/(tabs)/profile.tsx`:
```tsx
import { Text, View } from 'react-native';
export default function ProfileScreen() {
  return <View><Text>Perfil (Fase 9)</Text></View>;
}
```

La pantalla de "Mis viajes" será `app/(app)/(tabs)/index.tsx` y la rellenamos en esta fase (ver 3.4).

### 3.2 Modelo `Trip` y servicio

`src/types/trip.ts`:

```typescript
export type TripStatus = 'planned' | 'active' | 'completed';

export interface Trip {
  id: string;
  userId: string;
  title: string;
  destination: string;
  coverImage: string | null;
  startDate: string;  // ISO date
  endDate: string;
  budget: number | null;
  currency: string;
  status: TripStatus;
  createdAt: string;
}
```

`src/services/trips.ts` — funciones de acceso a datos:
- `listTrips(userId)` → `Promise<Trip[]>`
- `getTrip(id)` → `Promise<Trip>`
- `createTrip(data)` → `Promise<Trip>`
- `updateTrip(id, data)` → `Promise<Trip>`
- `deleteTrip(id)` → `Promise<void>`

Cada función hace la query con `supabase.from('trips')...` y mapea snake_case a camelCase.

### 3.3 tripStore (Zustand)

`src/store/tripStore.ts`:
- Estado: `trips: Trip[]`, `loading`, `error`, `selectedTripId`.
- Acciones: `fetchTrips()`, `addTrip(data)`, `editTrip(id, data)`, `removeTrip(id)`.
- Cada acción llama al servicio y actualiza el estado local (optimistic update opcional).

### 3.4 Pantalla "Mis viajes"

`app/(app)/(tabs)/index.tsx`:
- `FlatList` con `TripCard` por cada viaje.
- Cabecera con título "Mis viajes" y contador.
- **FAB** (botón flotante) abajo a la derecha → navega a `/trips/new` (modal de creación).
- Estado vacío: ilustración + "Aún no tienes viajes. ¡Crea el primero!"
- Pull-to-refresh para recargar.
- Swipe en cada tarjeta → acción "Eliminar".

`src/components/TripCard.tsx`:
- Imagen de portada (con fallback si no hay).
- Título, destino, rango de fechas.
- Barra de progreso o badge:
  - Si `status = 'planned'`: "En X días" (countdown con date-fns).
  - Si `status = 'active'`: "En curso" en verde.
  - Si `status = 'completed'`: "Completado" en gris.
- Tap → `router.push(\`/trips/\${trip.id}/itinerary\`)`.

### 3.5 Modal de creación de viaje

Expo Router presenta una pantalla como modal añadiendo `presentation: 'modal'` en la opción del Stack. Lo declaramos en el layout de `(app)`:

```tsx
// app/(app)/_layout.tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="trips/[id]" />
  <Stack.Screen name="trips/new" options={{ presentation: 'modal' }} />
</Stack>
```

Y creamos la pantalla en `app/(app)/trips/new.tsx`.

Campos:
1. **Destino** — input con autocompletado de Google Places.
2. **Título** — opcional, autocompletado al "Viaje a {destination}".
3. **Fechas** — date picker (de y hasta).
4. **Imagen de portada** — botones: "Subir foto" / "Buscar en Unsplash".
5. **Moneda** — selector con monedas comunes (EUR, USD, GBP...).
6. **Presupuesto estimado** — input numérico, opcional.

Validación:
- Destino y fechas obligatorios.
- `endDate >= startDate` (Supabase también lo valida con su CHECK).
- Presupuesto positivo si está presente.

Al guardar: `addTrip(data)` → `router.back()` para cerrar el modal.

### 3.6 Autocompletado de Google Places

Opción A: instalar `react-native-google-places-autocomplete` (más fácil, mantiene su propia UI).

Opción B: hacer llamadas manuales al endpoint `/place/autocomplete/json` y mostrar resultados en una lista.

Para no acoplarse a una librería con UI fija, recomendado **opción B** envuelta en un hook propio:

`src/hooks/usePlacesAutocomplete.ts`:
- Debounce de 300ms sobre el input.
- Llama a la API de Places con la API key.
- Devuelve lista de predicciones.
- Al seleccionar una predicción, llama al endpoint `/place/details/json` para obtener `lat`, `lng`, `place_id`.

> Cuidado: la API key NO debe ir hardcoded en el código. Usa `process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY` y restringe la key en Google Cloud Console (por bundle ID en iOS, por SHA-1 en Android).

### 3.7 Imagen de portada desde Unsplash

`src/services/unsplash.ts`:
- Endpoint `GET https://api.unsplash.com/search/photos?query={destination}`.
- Devuelve array de fotos con URLs en distintas resoluciones.
- Usar la `regular` (~1080px) y guardar la URL completa en `cover_image`.

Alternativa simple si quieres saltarte la API: pedir al usuario que suba la suya con `expo-image-picker`.

### 3.8 Detalle del viaje — cabecera básica

En esta fase solo la cabecera; las pestañas internas las hacemos en la Fase 4. Crea `app/(app)/trips/[id]/_layout.tsx` con un Stack temporal:

```tsx
import { Stack, useLocalSearchParams } from 'expo-router';

export default function TripDetailLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

Y `app/(app)/trips/[id]/index.tsx` con la cabecera:

```tsx
import { useLocalSearchParams } from 'expo-router';
// ...

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Cargar trip desde el store/servicio por id
  // ...
}
```

La pantalla muestra:
- Imagen de portada full-width con overlay degradado.
- Sobre el overlay: título, destino, fechas, countdown.
- Botones de acción: editar (lápiz) y eliminar (papelera).
- Debajo, un placeholder "Las pestañas del viaje vendrán en la siguiente fase".

> Nota: en la Fase 4 sustituiremos el `_layout.tsx` y este `index.tsx` por una estructura con las 4 pestañas internas (`itinerary`, `budget`, `packing`, `diary`).

### 3.9 Editar y eliminar

- **Editar**: reutilizar el modal de creación pasándole los datos del viaje. El botón guarda como "Actualizar" en vez de "Crear".
- **Eliminar**: alerta de confirmación → llamada a `removeTrip(id)`. El CASCADE de Postgres se encarga de borrar días, actividades, gastos, etc. (configurado en Fase 1).

---

## Decisiones técnicas

1. **Servicios separados del store** — `services/trips.ts` contiene las queries puras; `tripStore` orquesta estado y llama a servicios. Esto facilita testing.
2. **Mapeo snake_case ↔ camelCase manual** — alternativa: usar tipos generados de Supabase (`Database['public']['Tables']['trips']['Row']`) y mantener snake_case en TS. Aceptable también, decisión de estilo.
3. **Detail dentro de `trips/[id]/`** — usar un segmento dinámico permite que la URL real sea `/trips/abc-123`. Esto facilita deep linking ("abre este viaje desde un email").
4. **Modal vía `presentation: 'modal'`** — Expo Router declara modales como opción de pantalla. Da la animación nativa de iOS (subida desde abajo) sin tocar nada más.

---

## Verificación / Definition of Done

- [ ] Tras login, aparece la pantalla "Mis viajes" (vacía si no hay viajes).
- [ ] Crear un viaje funciona: aparece en la lista al instante y persiste tras reiniciar.
- [ ] Autocompletado de Google Places muestra sugerencias mientras escribes.
- [ ] El modal de creación se cierra con animación nativa al guardar.
- [ ] Tap en una tarjeta abre el detalle por URL `/trips/{id}/...`.
- [ ] Editar un viaje actualiza la tarjeta en la lista.
- [ ] Eliminar pide confirmación y desaparece de la lista.
- [ ] Las tabs inferiores funcionan (las otras dos pueden estar vacías).
- [ ] Pull-to-refresh recarga los viajes desde Supabase.

## Siguiente fase

→ [Fase 4 — Itinerario](./Fase_04_Itinerario.md)
