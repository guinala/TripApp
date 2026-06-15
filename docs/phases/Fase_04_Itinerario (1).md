# Fase 4 — Itinerario

## Objetivo

Implementar la pestaña de itinerario dentro de un viaje: vista de días con sus actividades, añadir actividades buscando lugares en Google Places, reordenar con drag & drop, y mapa interactivo con todos los pins sincronizados.

## Prerrequisitos

- Fase 3 completada (TripDetailScreen con cabecera funcional).
- API Key de Google Places ya configurada.

## Tareas

### 4.1 Top Tabs dentro del detalle del viaje

Expo Router trae `Stack` y `Tabs` (bottom) de serie, pero no `MaterialTopTabs`. Hay que envolverlo con `withLayoutContext` para integrarlo con el sistema de rutas.

Crea `app/(app)/trips/[id]/_top-tabs.tsx`:

```tsx
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext(Navigator);
```

Y sustituye `app/(app)/trips/[id]/_layout.tsx` por la estructura con cabecera + mapa + pestañas:

```tsx
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialTopTabs } from './_top-tabs';
import { TripHeader } from '@/components/TripHeader';
import { TripMap } from '@/components/TripMap';

export default function TripDetailLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1 }}>
      <TripHeader tripId={id} />
      <TripMap tripId={id} />
      <MaterialTopTabs>
        <MaterialTopTabs.Screen name="itinerary" options={{ title: 'Itinerario' }} />
        <MaterialTopTabs.Screen name="budget"    options={{ title: 'Presupuesto' }} />
        <MaterialTopTabs.Screen name="packing"   options={{ title: 'Equipaje' }} />
        <MaterialTopTabs.Screen name="diary"     options={{ title: 'Diario' }} />
      </MaterialTopTabs>
    </View>
  );
}
```

Cada pestaña es un fichero hermano:
- `app/(app)/trips/[id]/itinerary.tsx` *(implementada en esta fase)*
- `app/(app)/trips/[id]/budget.tsx` *(Fase 5)*
- `app/(app)/trips/[id]/packing.tsx` *(Fase 6)*
- `app/(app)/trips/[id]/diary.tsx` *(Fase 7)*

Borra el `index.tsx` provisional de la Fase 3 — ahora el contenido lo dicta el layout + las pantallas con nombre.

> Si una pestaña necesita el `tripId`, lo recoge con `useLocalSearchParams<{ id: string }>()` igual que el layout padre.

### 4.2 Generación automática de días

Cuando se abre un viaje por primera vez, comprobar si existen filas en `days` para ese `trip_id`. Si no, crearlas:

```typescript
import { eachDayOfInterval, parseISO } from 'date-fns';

async function ensureDays(trip: Trip) {
  const { data: existing } = await supabase
    .from('days')
    .select('id')
    .eq('trip_id', trip.id);

  if (existing && existing.length > 0) return;

  const dates = eachDayOfInterval({
    start: parseISO(trip.startDate),
    end: parseISO(trip.endDate),
  });

  const rows = dates.map((date, i) => ({
    trip_id: trip.id,
    day_number: i + 1,
    date: date.toISOString().slice(0, 10),
  }));

  await supabase.from('days').insert(rows);
}
```

Alternativa: hacerlo del lado servidor con una **Edge Function** o **trigger** en Postgres (cuando se inserta un trip, generar los days automáticamente). Es más limpio pero requiere más setup.

### 4.3 Modelo Activity + servicio

`src/types/activity.ts`:
```typescript
export type ActivityCategory = 'visit' | 'food' | 'transport' | 'stay';

export interface Activity {
  id: string;
  dayId: string;
  title: string;
  time: string | null;       // 'HH:mm'
  location: { lat: number; lng: number } | null;
  address: string | null;
  placeId: string | null;
  notes: string | null;
  category: ActivityCategory;
  orderIndex: number;
}
```

`src/services/activities.ts`:
- `listActivitiesByTrip(tripId)` → con un join, devuelve actividades agrupadas por día.
- `createActivity(data)`, `updateActivity(id, data)`, `deleteActivity(id)`, `reorderActivities(dayId, ids[])`.

### 4.4 Pantalla de Itinerario

`app/(app)/trips/[id]/itinerary.tsx`:
- Lista vertical de días, cada uno como una sección colapsable (acordeón).
- Cabecera del día: número, fecha legible ("Lunes 12 mayo"), botón "+ Actividad".
- Cuerpo: lista de actividades ordenadas por `orderIndex`.

`src/components/ActivityItem.tsx`:
- Hora (a la izquierda, en grande si está definida).
- Icono según categoría (Lucide o Feather Icons).
- Título y dirección.
- Notas (truncadas a 2 líneas, expandibles con tap).
- Tap largo → menú con editar/eliminar.

Estados:
- Día sin actividades: "Aún no has planeado nada para este día".
- Día con actividades: lista ordenada.

### 4.5 Mapa interactivo

`src/components/TripMap.tsx`:
- Componente `MapView` con altura fija (250-300px).
- Itera sobre todas las actividades del viaje y renderiza un `Marker` por cada una con `location`.
- Icono del marker varía según `category`.
- `region` inicial: centroide de todos los pins o `destination` del viaje.
- Al tocar un pin: muestra `Callout` con título, hora y día.
- Al tocar el Callout: scrollea la lista de itinerario hasta esa actividad.

```tsx
import MapView, { Marker } from 'react-native-maps';

<MapView style={{ height: 280 }} initialRegion={{ ... }}>
  {activities.map((a) => (
    a.location && (
      <Marker
        key={a.id}
        coordinate={a.location}
        pinColor={CATEGORY_COLORS[a.category]}
        onPress={() => scrollToActivity(a.id)}
      >
        <Callout>{/* ... */}</Callout>
      </Marker>
    )
  ))}
</MapView>
```

### 4.6 Añadir actividad

Modal con tres opciones de entrada:

**Opción 1: Buscar en Google Places**
- Reutiliza el hook `usePlacesAutocomplete` de la Fase 3.
- Al seleccionar, autocompleta título, dirección, `lat/lng` y `place_id`.

**Opción 2: Colocar pin manualmente en el mapa**
- Abre un mapa a pantalla completa.
- Long-press para colocar un pin.
- El usuario rellena el título a mano.

**Opción 3: Solo texto (sin ubicación)**
- Útil para actividades genéricas tipo "Desayuno en el hotel".

Campos comunes:
- Día (selector si no se abrió desde un día concreto).
- Hora (TimePicker, opcional).
- Categoría (selector con 4 opciones).
- Notas (textarea).

### 4.7 Drag & drop para reordenar

Librerías candidatas:
- **`react-native-draggable-flatlist`** — la más usada, basada en Reanimated y Gesture Handler. Simple de integrar.
- **`react-native-reanimated` puro** — más control pero mucha más complejidad.

Recomendado: `react-native-draggable-flatlist`.

```bash
npm install react-native-draggable-flatlist
```

```tsx
import DraggableFlatList from 'react-native-draggable-flatlist';

<DraggableFlatList
  data={activities}
  keyExtractor={(item) => item.id}
  renderItem={({ item, drag }) => <ActivityItem item={item} onLongPress={drag} />}
  onDragEnd={({ data }) => {
    const ids = data.map((a) => a.id);
    reorderActivities(dayId, ids);
  }}
/>
```

Al soltar, actualizar el `order_index` de las actividades afectadas en una sola query batch:

```typescript
async function reorderActivities(dayId: string, orderedIds: string[]) {
  const updates = orderedIds.map((id, index) => ({ id, order_index: index }));
  await supabase.from('activities').upsert(updates);
}
```

### 4.8 Sincronización pin ↔ actividad

- Al **crear** una actividad con ubicación: aparece automáticamente como pin en el mapa.
- Al **borrar** una actividad: el pin desaparece.
- Al **mover** un pin en el mapa (arrastrándolo): actualiza `location` de la actividad.
- Al **editar** una actividad y cambiarle el lugar: el pin se mueve.

Esto se logra haciendo que ambos componentes lean del mismo store/query. No hace falta lógica extra de sync.

---

## Decisiones técnicas

1. **Días generados al primer acceso** — simple y no requiere lógica de servidor. Si el usuario cambia las fechas del viaje, hay que decidir: ¿regenerar días? ¿solo añadir/eliminar los que cambien? Lo veremos cuando aparezca el caso.
2. **`MaterialTopTabs` con swipe** — UX común en apps de viajes (Tripadvisor, Booking). Cada tab carga sus datos al activarse para ahorrar memoria.
3. **`react-native-draggable-flatlist` en lugar de DIY** — saltarse 100+ líneas de código de gestos y animaciones para un patrón muy estándar.
4. **Long-press para activar drag** — evita arrastres accidentales al hacer scroll. Convención de iOS/Android.

---

## Verificación / Definition of Done

- [ ] Crear un viaje y abrirlo genera automáticamente todos los días entre las fechas.
- [ ] Añadir una actividad buscando con Google Places funciona y aparece en la lista.
- [ ] El pin de esa actividad aparece en el mapa al instante.
- [ ] Long-press en una actividad permite arrastrar y reordenar.
- [ ] Tocar un pin en el mapa abre su Callout con la info correcta.
- [ ] Editar la ubicación de una actividad mueve su pin.
- [ ] Eliminar una actividad la quita de la lista Y del mapa.

## Siguiente fase

→ [Fase 5 — Presupuesto](./Fase_05_Presupuesto.md)
