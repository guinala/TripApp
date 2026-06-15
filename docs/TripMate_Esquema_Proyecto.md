# TripMate — Organizador de Viajes con Mapa Interactivo

> **Plataforma:** React Native + Expo  
> **Estado:** Fase de diseño  
> **Fecha de inicio:** Mayo 2026

---

## 1. Descripción general

TripMate es una app multiplataforma (iOS y Android) para planificar, organizar y documentar viajes. Permite crear itinerarios día a día con puntos de interés sobre un mapa interactivo, controlar el presupuesto en múltiples divisas, preparar checklists de equipaje y guardar un diario fotográfico de cada viaje. Todo sincronizado en la nube.

---

## 2. Stack tecnológico

| Capa             | Tecnología                                      |
|------------------|--------------------------------------------------|
| Framework        | React Native + Expo (Managed workflow)           |
| Navegación       | React Navigation (Stack + Bottom Tabs)           |
| Estado global    | Zustand                                          |
| Mapas            | react-native-maps o @rnmapbox/maps               |
| Animaciones      | react-native-reanimated + gesture-handler        |
| Backend          | Firebase (Auth, Firestore, Cloud Storage) o Supabase |
| Gráficos         | react-native-chart-kit o Victory Native          |
| Imágenes externas| API de Unsplash / Pexels                         |
| Lugares          | Google Places API                                |
| Clima            | OpenWeather API                                  |
| Fechas           | date-fns                                         |
| Fotos            | expo-image-picker                                |

---

## 3. Arquitectura de navegación

```
SplashScreen
  └── AuthStack
        ├── LoginScreen
        └── RegisterScreen
              └── MainTabs (Bottom Tab Navigator)
                    ├── Tab 1: MisViajesStack
                    │     ├── TripListScreen
                    │     └── TripDetailScreen
                    │           ├── ItineraryTab (días + actividades)
                    │           ├── BudgetTab (gastos + gráficos)
                    │           ├── PackingTab (checklist equipaje)
                    │           └── PhotoDiaryTab (galería + notas)
                    ├── Tab 2: ExploreStack
                    │     ├── ExploreScreen (feed de destinos)
                    │     ├── DestinationDetailScreen
                    │     └── InteractiveMapScreen
                    └── Tab 3: ProfileStack
                          ├── ProfileScreen (stats + avatar)
                          └── SettingsScreen
```

---

## 4. Pantallas y funcionalidades detalladas

### 4.1 Mis viajes (TripListScreen)
- Lista de tarjetas con imagen de portada, destino, fechas y barra de progreso (días restantes o viaje completado).
- FAB (botón flotante) para crear nuevo viaje.
- Formulario de creación: destino (autocompletado con Google Places), fechas (date picker), portada (foto propia o búsqueda en Unsplash), moneda y presupuesto estimado.
- Swipe para eliminar o archivar viajes.

### 4.2 Detalle del viaje (TripDetailScreen)
- **Cabecera**: imagen de portada con overlay de título, fechas y countdown.
- **Mapa interactivo** en la parte superior con pins de todas las actividades del viaje. Al tocar un pin se muestra un tooltip con nombre, hora y día.
- **Pestañas internas** (TabView):

#### Itinerario por días
- Cada día es una sección colapsable con su fecha.
- Las actividades muestran: hora, nombre, ubicación, icono de categoría y notas.
- Drag & drop para reordenar actividades (react-native-reanimated).
- Añadir actividad: buscar lugar con Google Places o colocar pin manualmente en el mapa.
- Al añadir una actividad, se crea automáticamente el pin en el mapa.

#### Presupuesto
- Registro de gastos: cantidad, moneda, categoría (transporte, alojamiento, comida, ocio, otros), descripción y fecha.
- Conversión automática de divisas con tipos de cambio actualizados.
- Gráfico circular por categoría y gráfico de barras por día.
- Indicador de gasto total vs. presupuesto con barra de progreso y alerta si se supera el 80%.

#### Checklist de equipaje
- Lista agrupada por categorías: documentos, ropa, electrónica, higiene, otros.
- Checkbox por ítem, contador de progreso (ej: "12/18 preparados").
- Plantillas predeterminadas según tipo de viaje (playa, montaña, ciudad, negocios).
- Opción de duplicar checklist de viajes anteriores.

#### Diario de fotos
- Galería organizada por días.
- Cada foto permite: título/nota y ubicación (automática por GPS o manual).
- Visualización en grid o en timeline.
- Opción futura: exportar diario como PDF de recuerdo.

### 4.3 Explorar (ExploreScreen)
- Feed de destinos populares con tarjetas visuales (foto, nombre, puntuación, continente).
- Buscador con filtros: continente, tipo de viaje (aventura, relax, cultural, gastro), rango de presupuesto.
- Ficha de destino: descripción, clima actual (OpenWeather API), puntos de interés recomendados, galería de fotos.
- Botón "Añadir a un viaje" que crea un viaje nuevo o asocia el destino a uno existente.

### 4.4 Perfil (ProfileScreen)
- Avatar, nombre y email.
- Estadísticas: países visitados (mapa mundi coloreado), número de viajes, kilómetros recorridos.
- Ajustes: moneda por defecto, tema claro/oscuro, idioma, notificaciones.
- Cerrar sesión.

---

## 5. Modelo de datos

### User
| Campo           | Tipo      | Descripción                  |
|-----------------|-----------|-------------------------------|
| id              | string    | UID de Firebase Auth          |
| email           | string    | Email del usuario             |
| displayName     | string    | Nombre visible                |
| avatarUrl       | string?   | URL de la foto de perfil      |
| defaultCurrency | string    | Moneda por defecto (EUR, USD) |
| createdAt       | timestamp | Fecha de registro             |

### Trip
| Campo      | Tipo      | Descripción                         |
|------------|-----------|--------------------------------------|
| id         | string    | ID autogenerado                      |
| userId     | string    | Referencia al usuario                |
| title      | string    | Nombre del viaje                     |
| destination| string    | Destino principal                    |
| coverImage | string    | URL de la imagen de portada          |
| startDate  | date      | Fecha de inicio                      |
| endDate    | date      | Fecha de fin                         |
| budget     | number    | Presupuesto estimado                 |
| currency   | string    | Moneda del presupuesto               |
| status     | enum      | planned / active / completed         |
| createdAt  | timestamp | Fecha de creación                    |

### Day
| Campo     | Tipo   | Descripción                    |
|-----------|--------|--------------------------------|
| id        | string | ID autogenerado                |
| tripId    | string | Referencia al viaje            |
| dayNumber | number | Número de día (1, 2, 3...)     |
| date      | date   | Fecha del día                  |
| notes     | string?| Notas generales del día        |

### Activity
| Campo    | Tipo   | Descripción                     |
|----------|--------|---------------------------------|
| id       | string | ID autogenerado                 |
| dayId    | string | Referencia al día               |
| title    | string | Nombre de la actividad          |
| time     | string | Hora estimada (HH:mm)          |
| location | object | { lat: number, lng: number }    |
| address  | string?| Dirección legible               |
| placeId  | string?| ID de Google Places             |
| notes    | string?| Notas adicionales               |
| category | enum   | visit / food / transport / stay |
| order    | number | Posición en la lista del día    |

### Expense
| Campo       | Tipo   | Descripción                       |
|-------------|--------|-----------------------------------|
| id          | string | ID autogenerado                   |
| tripId      | string | Referencia al viaje               |
| amount      | number | Cantidad gastada                  |
| currency    | string | Moneda del gasto                  |
| category    | enum   | transport / food / stay / leisure / other |
| description | string | Descripción breve                 |
| date        | date   | Fecha del gasto                   |

### PackingItem
| Campo    | Tipo    | Descripción                    |
|----------|---------|--------------------------------|
| id       | string  | ID autogenerado                |
| tripId   | string  | Referencia al viaje            |
| name     | string  | Nombre del ítem                |
| category | enum    | docs / clothes / tech / hygiene / other |
| checked  | boolean | Si ya está preparado           |

### Photo
| Campo     | Tipo      | Descripción                   |
|-----------|-----------|-------------------------------|
| id        | string    | ID autogenerado               |
| tripId    | string    | Referencia al viaje           |
| dayId     | string?   | Referencia al día (opcional)  |
| uri       | string    | URL en Cloud Storage          |
| caption   | string?   | Texto descriptivo             |
| location  | object?   | { lat, lng }                  |
| timestamp | timestamp | Momento de la captura         |

---

## 6. Siguientes tareas

### Fase 1 — Setup y estructura base
- [ ] Crear proyecto con `npx create-expo-app TripMate`
- [ ] Configurar estructura de carpetas: `/src/screens`, `/src/components`, `/src/services`, `/src/store`, `/src/navigation`, `/src/models`, `/src/utils`
- [ ] Instalar dependencias core: react-navigation, zustand, react-native-maps, reanimated, gesture-handler
- [ ] Configurar navegación completa (AuthStack + MainTabs + Stacks internos)
- [ ] Configurar Firebase (Auth + Firestore + Storage) o Supabase
- [ ] Crear store de Zustand con slices: authStore, tripStore, uiStore

### Fase 2 — Autenticación
- [ ] Pantalla de Login con email/contraseña
- [ ] Pantalla de Registro
- [ ] Integrar Google Sign-In
- [ ] Persistencia de sesión (auto-login si hay token válido)
- [ ] Pantalla Splash con verificación de sesión

### Fase 3 — Mis viajes (CRUD básico)
- [ ] TripListScreen: listar viajes del usuario desde Firestore
- [ ] Formulario de creación de viaje con validación
- [ ] Integrar Google Places para autocompletado de destinos
- [ ] TripDetailScreen con cabecera y mapa básico
- [ ] Eliminar y editar viajes

### Fase 4 — Itinerario
- [ ] Modelo Day + Activity en Firestore
- [ ] Vista de días con actividades listadas
- [ ] Añadir actividad (manual + búsqueda de lugar)
- [ ] Drag & drop para reordenar actividades
- [ ] Pins en el mapa vinculados a actividades (sync bidireccional)

### Fase 5 — Presupuesto
- [ ] Formulario de gasto con categoría, moneda, cantidad
- [ ] Listado de gastos por viaje
- [ ] Gráfico circular por categoría (react-native-chart-kit)
- [ ] Barra de progreso presupuesto gastado vs. estimado
- [ ] Conversión de divisas (API externa o tabla local)

### Fase 6 — Checklist de equipaje
- [ ] CRUD de ítems agrupados por categoría
- [ ] Checkbox con contador de progreso
- [ ] Plantillas predeterminadas por tipo de viaje
- [ ] Duplicar checklist desde viajes anteriores

### Fase 7 — Diario de fotos
- [ ] expo-image-picker para seleccionar/tomar fotos
- [ ] Subida a Cloud Storage con referencia en Firestore
- [ ] Galería por día con visualización grid/timeline
- [ ] Añadir caption y ubicación a cada foto

### Fase 8 — Explorar
- [ ] Feed de destinos (datos estáticos iniciales o API)
- [ ] Buscador con filtros
- [ ] Ficha de destino con clima (OpenWeather)
- [ ] Botón "Añadir a viaje"

### Fase 9 — Perfil y ajustes
- [ ] Pantalla de perfil con estadísticas
- [ ] Mapa mundi con países visitados coloreados
- [ ] Ajustes: tema, moneda, notificaciones
- [ ] Editar perfil (nombre, avatar)

### Fase 10 — Pulido y lanzamiento
- [ ] Animaciones y transiciones (reanimated)
- [ ] Manejo de errores y estados vacíos
- [ ] Modo offline (caché local con Zustand persist o WatermelonDB)
- [ ] Testing (Jest + React Native Testing Library)
- [ ] Optimización de rendimiento (FlatList, memo, lazy loading)
- [ ] Preparar builds para App Store y Google Play con EAS Build
