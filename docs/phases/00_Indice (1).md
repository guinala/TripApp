# TripMate — Índice de fases

Cada fase tiene su propio fichero con objetivos, tareas detalladas, decisiones técnicas y criterios de "terminado".

| Fase | Fichero | Estado |
|------|---------|--------|
| 1 | [Setup inicial](./Fase_01_Setup_inicial.md) | En curso |
| 2 | [Autenticación](./Fase_02_Autenticacion.md) | Pendiente |
| 3 | [Mis viajes (CRUD)](./Fase_03_Mis_viajes.md) | Pendiente |
| 4 | [Itinerario](./Fase_04_Itinerario.md) | Pendiente |
| 5 | [Presupuesto](./Fase_05_Presupuesto.md) | Pendiente |
| 6 | [Checklist de equipaje](./Fase_06_Checklist_equipaje.md) | Pendiente |
| 7 | [Diario de fotos](./Fase_07_Diario_fotos.md) | Pendiente |
| 8 | [Explorar](./Fase_08_Explorar.md) | Pendiente |
| 9 | [Perfil y ajustes](./Fase_09_Perfil_ajustes.md) | Pendiente |
| 10 | [Pulido y lanzamiento](./Fase_10_Pulido_lanzamiento.md) | Pendiente |

## Stack tecnológico decidido

- **Framework:** React Native + Expo (Managed workflow, SDK más reciente)
- **Lenguaje:** TypeScript
- **Navegación:** Expo Router (file-based, basado en React Navigation por debajo)
- **Pestañas internas:** `@react-navigation/material-top-tabs` vía `withLayoutContext`
- **Estado global:** Zustand
- **Backend:** Supabase (Auth + Postgres + Storage)
- **Mapas:** react-native-maps
- **Animaciones:** react-native-reanimated + react-native-gesture-handler
- **Gráficos:** react-native-chart-kit + react-native-svg
- **Fechas:** date-fns
- **APIs externas:** Google Places, OpenWeather, Unsplash/Pexels, ExchangeRate (frankfurter.app)
- **Herramientas:** ESLint (config Expo) + Prettier

## Convenciones del proyecto

- **Rutas:** todo lo navegable vive en `app/`. Lógica reutilizable en `src/`.
- **Nombres de archivos:** PascalCase para componentes (`TripCard.tsx`), camelCase para utilidades (`formatDate.ts`). Las pantallas de Expo Router van en kebab-case o lowercase por la naturaleza del routing (`login.tsx`, `trips/[id]/itinerary.tsx`).
- **Columnas BD:** snake_case (convención Postgres), mapeo a camelCase en TS.
- **Importaciones:** absolutas con alias `@/` apuntando a `src/`.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`...).
