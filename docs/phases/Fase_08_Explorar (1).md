# Fase 8 — Explorar

## Objetivo

Implementar la segunda pestaña principal: un feed de destinos populares con búsqueda, filtros, ficha detallada con clima en tiempo real, y opción de "Añadir a viaje" desde cualquier destino.

## Prerrequisitos

- Fase 7 completada.
- API key de OpenWeather (gratis en [openweathermap.org/api](https://openweathermap.org/api)).

## Tareas

### 8.1 Fuente de datos de destinos

Dos opciones según ambición:

**Opción A — Estática (recomendada para empezar)**

`src/constants/destinations.ts`: array de 30-50 destinos curados manualmente:

```typescript
export interface Destination {
  id: string;
  name: string;
  country: string;
  continent: 'Europa' | 'Asia' | 'África' | 'América' | 'Oceanía';
  types: ('aventura' | 'relax' | 'cultural' | 'gastro')[];
  priceRange: 'low' | 'mid' | 'high';
  description: string;
  coverImage: string;
  coordinates: { lat: number; lng: number };
  highlights: string[];
}

export const DESTINATIONS: Destination[] = [
  {
    id: 'tokyo',
    name: 'Tokio',
    country: 'Japón',
    continent: 'Asia',
    types: ['cultural', 'gastro'],
    priceRange: 'high',
    description: '...',
    coverImage: 'https://images.unsplash.com/...',
    coordinates: { lat: 35.6762, lng: 139.6503 },
    highlights: ['Templo Senso-ji', 'Cruce de Shibuya', 'Mercado de Tsukiji'],
  },
  // ...
];
```

**Opción B — Dinámica (futuro)**

Tabla `destinations` en Supabase, posibilidad de feed personalizado por usuario, recomendaciones por ML. Mucho más trabajo, se deja para una v2.

### 8.2 Pantalla principal

`app/(app)/(tabs)/explore.tsx`:

Layout:
1. **Barra de búsqueda** sticky arriba.
2. **Chips de filtro** horizontales debajo (continente, tipo, presupuesto).
3. **Feed** de destinos en grid o lista vertical.

`src/components/DestinationCard.tsx`:
- Imagen full-width arriba.
- Sobre la imagen (overlay): nombre + continente.
- Debajo: chips pequeños de tipo, indicador de precio (`€`, `€€`, `€€€`).
- Tap → navega a `DestinationDetailScreen`.

### 8.3 Búsqueda y filtros

`src/hooks/useDestinationFilter.ts`:
- Input controlado para el query.
- Filtros activos como `Set<string>` por categoría.
- Devuelve la lista filtrada con `useMemo`.

Lógica:
- **Search** matchea en `name`, `country`, `description` (case-insensitive).
- **Continente** restringe a uno o varios.
- **Tipo** intersecta — un destino debe tener AL MENOS uno de los tipos seleccionados.
- **Precio** restringe a los rangos seleccionados.

UI de filtros:
- Botón "Filtros" en la barra superior → abre bottom sheet con todos los filtros agrupados.
- Chips horizontales para los más usados (continentes).
- Botón "Limpiar filtros" cuando hay alguno activo.

### 8.4 Ficha de destino

`app/(app)/destinations/[id].tsx`:

Estructura tipo "ficha de destino":
1. **Hero** con imagen grande y nombre.
2. **Clima actual** (sección con datos de OpenWeather).
3. **Descripción** larga.
4. **Highlights** — lista de puntos de interés con tarjetas pequeñas.
5. **Galería** — más fotos del destino (Unsplash search query con el nombre).
6. **Botón flotante "Añadir a viaje"**.

### 8.5 Integración OpenWeather

`src/services/weather.ts`:

```typescript
const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_KEY;
const BASE = 'https://api.openweathermap.org/data/2.5';

export async function getCurrentWeather(lat: number, lng: number) {
  const url = `${BASE}/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric&lang=es`;
  const res = await fetch(url);
  return res.json();
}

export async function getForecast(lat: number, lng: number) {
  const url = `${BASE}/forecast?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric&lang=es`;
  const res = await fetch(url);
  return res.json();
}
```

Componente `WeatherCard`:
- Temperatura grande.
- Icono del estado del cielo (mapea `weather[0].icon` a iconos propios o usa los de OpenWeather).
- Min/max del día.
- Humedad y viento.

Cachear respuestas con TTL de 15-30 min — el clima no cambia tanto.

### 8.6 Galería de Unsplash

`src/services/unsplash.ts`:
- `searchPhotos(query, page = 1, perPage = 10)`.
- Devuelve `{ results, total_pages }`.

En la ficha del destino, una fila horizontal scrolleable con 10 fotos relacionadas.

### 8.7 Botón "Añadir a viaje"

Modal con dos opciones:
1. **Crear un viaje nuevo** con este destino preseleccionado → abre el modal de creación de la Fase 3, con campos rellenados.
2. **Añadir a un viaje existente** → dropdown de viajes del usuario. Al seleccionar uno, ¿qué hacemos?
   - Opción simple: el destino se convierte en una actividad del primer día.
   - Opción mejor: crear una "ubicación a visitar" sin día asignado (requiere repensar el modelo, dejar para v2).

Recomendado: empezar con "Crear viaje nuevo" y dejar el "añadir a existente" para más adelante.

---

## Decisiones técnicas

1. **Destinos estáticos en código** — control total sobre la curación, sin necesidad de admin panel, sin coste extra de BD. Para una v2 con mucho contenido, migrar a BD.
2. **Sin BD = sin sync** — los destinos viven en el bundle de la app. Para añadir más, actualización de app. Trade-off aceptable en MVP.
3. **Caché de clima** — TTL corto pero suficiente para evitar rate limits gratuitos de OpenWeather (1000 calls/día).
4. **OpenWeather vs alternativas** — OpenWeather tiene tier gratuito y buena cobertura mundial. Tomorrow.io y WeatherAPI son alternativas con tiers gratuitos también.

---

## Verificación / Definition of Done

- [ ] El feed muestra todos los destinos al entrar.
- [ ] Filtrar por "Asia + cultural" reduce la lista correctamente.
- [ ] La búsqueda por nombre encuentra destinos (case-insensitive, parcial).
- [ ] La ficha de destino muestra clima actual real.
- [ ] La galería de Unsplash carga 10 fotos del destino.
- [ ] "Añadir a viaje" crea un nuevo viaje con el destino prerelleno.

## Siguiente fase

→ [Fase 9 — Perfil y ajustes](./Fase_09_Perfil_ajustes.md)
