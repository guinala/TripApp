# Fase 1 — Setup inicial

## Objetivo

Tener un proyecto Expo + TypeScript funcionando con todas las dependencias instaladas, Supabase configurado (cliente + base de datos + Storage), y un entorno de desarrollo con linting y formateo automático.

## Prerrequisitos

- Node.js LTS (≥ 20)
- Git
- VS Code con extensiones **ESLint** (`dbaeumer.vscode-eslint`) y **Prettier** (`esbenp.prettier-vscode`)
- Cuenta de Supabase (gratis en [supabase.com](https://supabase.com))
- App **Expo Go** instalada en el móvil para probar
- Opcional: Android Studio para emulador, Xcode si estás en Mac

## Decisiones tomadas

| Decisión | Elección | Motivo |
|----------|----------|--------|
| Lenguaje | TypeScript | Modelos de datos complejos, navegación anidada, stores |
| Navegación | Expo Router | File-based routing, deep linking nativo, estándar moderno en Expo |
| Backend | Supabase | Aprendizaje + open source + Postgres |
| Mapas | react-native-maps | Gratis, integración Expo directa |
| Formato config | Flat config (eslint.config.js) | Estándar desde ESLint 9 / Expo SDK 53+ |

---

## Tareas

### 1.1 Crear el proyecto

La plantilla por defecto de Expo ya incluye Expo Router, TypeScript y la estructura `app/`:

```bash
npx create-expo-app@latest TripMate
cd TripMate
```

Esto te crea de salida:
- Carpeta `app/` con `_layout.tsx` raíz y pantallas de ejemplo.
- `package.json` con `"main": "expo-router/entry"` ya configurado.
- TypeScript activado por defecto.
- `app.json` con `"scheme"` y `"plugins": ["expo-router"]` listos.

### 1.2 Estructura de carpetas

Expo Router define la navegación en `app/`. Todo lo demás (lógica, servicios, componentes reutilizables) vive en `src/`:

```bash
# Vaciar las pantallas de ejemplo de la plantilla:
rm -rf app/*
mkdir -p "app/(auth)" "app/(app)/(tabs)" "app/(app)/trips/[id]"

# Crear src/ para la lógica:
mkdir -p src/{components,services,store,models,utils,hooks,constants,types}
```

Estructura objetivo:
```
app/                       # Rutas (Expo Router las descubre por nombre)
├── _layout.tsx            # Raíz: providers + bootstrap auth
├── (auth)/                # Grupo no autenticado
│   ├── _layout.tsx
│   ├── login.tsx
│   └── register.tsx
└── (app)/                 # Grupo autenticado
    ├── _layout.tsx        # Gate de sesión
    ├── (tabs)/            # Tabs inferiores
    │   ├── _layout.tsx
    │   ├── index.tsx      # Mis viajes
    │   ├── explore.tsx
    │   └── profile.tsx
    └── trips/[id]/        # Detalle de viaje
        ├── _layout.tsx    # Top tabs internas
        ├── itinerary.tsx
        ├── budget.tsx
        ├── packing.tsx
        └── diary.tsx

src/                       # Todo lo que NO es una ruta
├── components/            # Componentes reutilizables
├── services/              # Cliente Supabase, APIs externas
├── store/                 # Slices de Zustand
├── models/                # Lógica de negocio por entidad
├── utils/                 # Funciones puras
├── hooks/                 # Custom hooks
├── constants/             # Colores, fuentes, theme
└── types/                 # Tipos compartidos
```

> **Importante:** los paréntesis en `(auth)`, `(app)`, `(tabs)` son "grupos": agrupan rutas para compartir layout sin afectar a la URL. `/login` está dentro de `(auth)` pero la URL final es `/login`.

### 1.3 Instalar dependencias

**Navegación adicional:**

Expo Router, `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, `react-native-screens` y `react-native-safe-area-context` **ya vienen con la plantilla por defecto**. Solo añadimos lo que falta para las pestañas internas con swipe (Material Top Tabs):

```bash
npm install @react-navigation/material-top-tabs react-native-tab-view react-native-pager-view
```

**Estado, animaciones y gestos:**
```bash
npm install zustand
npx expo install react-native-reanimated react-native-gesture-handler
```
Nota: desde Expo SDK 50 el plugin de Reanimated viene incluido en `babel-preset-expo` automáticamente. **No hay que crear `babel.config.js`.**

**Mapas y ubicación:**
```bash
npx expo install react-native-maps expo-location
```

**Supabase:**
```bash
npm install @supabase/supabase-js
npx expo install react-native-url-polyfill @react-native-async-storage/async-storage
```

**OAuth para Google Sign-In:**
```bash
npx expo install expo-auth-session expo-crypto
```

**Multimedia y fechas:**
```bash
npx expo install expo-image-picker expo-file-system expo-image expo-image-manipulator
npm install date-fns
```

**Gráficos:**
```bash
npm install react-native-chart-kit
npx expo install react-native-svg
```

### 1.4 Configurar el root layout

Con Expo Router, el entry point ya no es `App.tsx` sino `app/_layout.tsx`. Sustituye el contenido que venga por defecto con:

```tsx
import 'react-native-gesture-handler'; // primera línea siempre
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* En la Fase 2 añadiremos aquí la inicialización del authStore */}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

Crea un `index.tsx` provisional en la raíz de `app/` para que la app arranque mientras no haya layouts de `(auth)` y `(app)`:

```tsx
// app/index.tsx — temporal hasta la Fase 2
import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>TripMate</Text>
    </View>
  );
}
```

---

## 1.5 Setup de Supabase

### 1.5.1 Crear el proyecto

1. Entrar en [supabase.com](https://supabase.com), crear cuenta y nuevo proyecto.
2. Región **Frankfurt (eu-central-1)** por latencia desde España.
3. Contraseña fuerte de DB → guardarla en un gestor de contraseñas.
4. Esperar ~2 minutos a que se aprovisione.

### 1.5.2 Obtener credenciales

En el dashboard: **⚙️ Settings → API**. Copiar:
- **Project URL** (formato `https://xxxxx.supabase.co`)
- **anon public key** (en la pestaña *Legacy API Keys*; es un JWT largo)

> Nunca copiar la `service_role` key al cliente — esa salta todas las políticas de seguridad.

### 1.5.3 Variables de entorno

Crear `.env` en la raíz:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Añadir a `.gitignore`:
```
.env
.env.*
!.env.example
```

Crear `.env.example` (sin valores reales) para que otros sepan qué variables hay.

### 1.5.4 Cliente de Supabase

`src/services/supabase.ts`:

```typescript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase en .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // crítico en móvil
  },
});
```

---

## 1.6 Esquema de base de datos

En el **SQL Editor** de Supabase, ejecutar las siguientes secciones (de una en una para detectar errores).

### 1.6.1 Tablas

```sql
-- PROFILES (extiende auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  default_currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TRIPS
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  destination text not null,
  cover_image text,
  start_date date not null,
  end_date date not null,
  budget numeric(10,2),
  currency text not null default 'EUR',
  status text not null default 'planned'
    check (status in ('planned','active','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index trips_user_id_idx on public.trips(user_id);

-- DAYS
create table public.days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_number int not null,
  date date not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (trip_id, day_number)
);
create index days_trip_id_idx on public.days(trip_id);

-- ACTIVITIES
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.days(id) on delete cascade,
  title text not null,
  time time,
  location jsonb,
  address text,
  place_id text,
  notes text,
  category text not null default 'visit'
    check (category in ('visit','food','transport','stay')),
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
create index activities_day_id_idx on public.activities(day_id);

-- EXPENSES
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'EUR',
  category text not null default 'other'
    check (category in ('transport','food','stay','leisure','other')),
  description text,
  date date not null default current_date,
  created_at timestamptz not null default now()
);
create index expenses_trip_id_idx on public.expenses(trip_id);

-- PACKING_ITEMS
create table public.packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  category text not null default 'other'
    check (category in ('docs','clothes','tech','hygiene','other')),
  checked boolean not null default false,
  created_at timestamptz not null default now()
);
create index packing_items_trip_id_idx on public.packing_items(trip_id);

-- PHOTOS
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_id uuid references public.days(id) on delete set null,
  uri text not null,
  caption text,
  location jsonb,
  taken_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index photos_trip_id_idx on public.photos(trip_id);
create index photos_day_id_idx on public.photos(day_id);
```

### 1.6.2 Trigger de auto-creación de profile

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 1.6.3 Row Level Security

```sql
alter table public.profiles      enable row level security;
alter table public.trips         enable row level security;
alter table public.days          enable row level security;
alter table public.activities    enable row level security;
alter table public.expenses      enable row level security;
alter table public.packing_items enable row level security;
alter table public.photos        enable row level security;

-- profiles
create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- trips
create policy "Users can read own trips"
  on public.trips for select using (auth.uid() = user_id);
create policy "Users can insert own trips"
  on public.trips for insert with check (auth.uid() = user_id);
create policy "Users can update own trips"
  on public.trips for update using (auth.uid() = user_id);
create policy "Users can delete own trips"
  on public.trips for delete using (auth.uid() = user_id);

-- tablas hijas: acceso vía trip
create policy "Users can manage days of own trips"
  on public.days for all using (
    exists (select 1 from public.trips
      where trips.id = days.trip_id and trips.user_id = auth.uid())
  );

create policy "Users can manage activities of own trips"
  on public.activities for all using (
    exists (select 1 from public.days
      join public.trips on trips.id = days.trip_id
      where days.id = activities.day_id and trips.user_id = auth.uid())
  );

create policy "Users can manage expenses of own trips"
  on public.expenses for all using (
    exists (select 1 from public.trips
      where trips.id = expenses.trip_id and trips.user_id = auth.uid())
  );

create policy "Users can manage packing items of own trips"
  on public.packing_items for all using (
    exists (select 1 from public.trips
      where trips.id = packing_items.trip_id and trips.user_id = auth.uid())
  );

create policy "Users can manage photos of own trips"
  on public.photos for all using (
    exists (select 1 from public.trips
      where trips.id = photos.trip_id and trips.user_id = auth.uid())
  );
```

### 1.6.4 Triggers de updated_at

```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_trips_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();
```

### 1.6.5 Bucket de Storage para fotos

En el dashboard: **Storage → New bucket** → `trip-photos` → **Private** → Create.

Luego en **Storage → Policies → trip-photos**, crear dos políticas:

**Política SELECT (lectura):**
```sql
(bucket_id = 'trip-photos' and (storage.foldername(name))[1] = auth.uid()::text)
```

**Política INSERT (subida):**
```sql
(bucket_id = 'trip-photos' and (storage.foldername(name))[1] = auth.uid()::text)
```

Convención de rutas: `{user_id}/{trip_id}/{filename}.jpg`

---

## 1.7 ESLint + Prettier

### 1.7.1 ESLint con la config de Expo

```bash
npx expo lint
```
Acepta la instalación. Crea `eslint.config.js` con flat config y añade el script `lint` a `package.json`.

### 1.7.2 Prettier

```bash
npm install -D prettier eslint-config-prettier
```

### 1.7.3 Conectar Prettier con ESLint

Editar `eslint.config.js`:

```js
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  eslintConfigPrettier, // siempre al final
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*'],
  },
]);
```

### 1.7.4 Configuración de Prettier

`.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

`.prettierignore`:
```
node_modules
.expo
dist
build
android
ios
*.lock
package-lock.json
.env*
```

### 1.7.5 Scripts en package.json

```json
{
  "scripts": {
    "lint": "expo lint",
    "lint:fix": "expo lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

### 1.7.6 Integración con VS Code

`.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.useFlatConfig": true,
  "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[typescriptreact]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[javascript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[json]": { "editor.defaultFormatter": "esbenp.prettier-vscode" }
}
```

Esta carpeta **sí se sube al repo** (no a `.gitignore`).

---

## 1.8 Generar tipos de TypeScript desde Supabase (opcional)

Para tener autocompletado y validación de tipos en consultas a la BD:

```bash
npm install -D supabase
npx supabase login
npx supabase gen types typescript --project-id <tu-project-id> --schema public > src/types/database.ts
```

El project-id está en la URL del dashboard: `https://supabase.com/dashboard/project/<project-id>`.

Después, en `supabase.ts`:
```typescript
import type { Database } from '../types/database';
export const supabase = createClient<Database>(...);
```

---

## Decisiones de diseño

1. **`profiles` en lugar de `users`** — Supabase gestiona `auth.users` internamente; nunca tocar esa tabla.
2. **snake_case en SQL, camelCase en TS** — convenciones nativas de cada lenguaje.
3. **`order_index` en lugar de `order`** — `order` es palabra reservada en SQL.
4. **`taken_at` en lugar de `timestamp`** — `timestamp` es tipo de dato Postgres, lía mucho.
5. **CHECK constraints en vez de ENUM** — más flexibles durante el desarrollo.
6. **`jsonb` para coordenadas** — extensible sin migraciones.
7. **RLS vía joins en tablas hijas** — mantiene los datos normalizados sin denormalizar `user_id`.

---

## Verificación / Definition of Done

- [ ] `npx expo start` arranca sin errores.
- [ ] La app se abre en Expo Go mostrando pantalla en blanco con StatusBar visible.
- [ ] En Supabase: ejecutar `select tablename, rowsecurity from pg_tables where schemaname = 'public';` y comprobar las 7 tablas con `rowsecurity = true`.
- [ ] Crear un usuario de prueba en **Authentication → Users → Add user** y verificar que aparece automáticamente en `profiles` (trigger funcionando).
- [ ] El bucket `trip-photos` existe en Storage y es privado.
- [ ] `npm run lint` pasa sin errores graves.
- [ ] Al guardar un archivo en VS Code, se formatea automáticamente.

## Siguiente fase

→ [Fase 2 — Autenticación](./Fase_02_Autenticacion.md)
