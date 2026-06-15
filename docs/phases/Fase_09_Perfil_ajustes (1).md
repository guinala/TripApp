# Fase 9 — Perfil y ajustes

## Objetivo

Construir la tercera pestaña principal: perfil del usuario con estadísticas de viajes, mapa de países visitados, y pantalla de ajustes con tema, moneda por defecto, idioma y gestión de cuenta.

## Prerrequisitos

- Fase 8 completada.

## Tareas

### 9.1 Pantalla de Perfil

`app/(app)/(tabs)/profile.tsx`:

Layout vertical:
1. **Cabecera** con avatar, nombre y email.
2. **Estadísticas** en grid 2x2:
   - Países visitados.
   - Total de viajes.
   - Días viajados (suma de duraciones).
   - Kilómetros recorridos (estimación).
3. **Mapa mundi** con países visitados coloreados.
4. **Lista de opciones**: Editar perfil, Ajustes, Cerrar sesión.

### 9.2 Avatar

- Si el usuario tiene `avatar_url` en `profiles`, mostrar esa imagen.
- Si no, mostrar iniciales sobre fondo de color generado a partir del email (hash → HSL).
- Tap → abrir picker, subir a Storage → actualizar `profiles.avatar_url`.

Convención de ruta en Storage: `avatars/{user_id}.jpg`. Bucket aparte `user-avatars`, **público** (las miniaturas no son sensibles).

### 9.3 Cálculo de estadísticas

`src/utils/stats.ts`:

```typescript
async function getUserStats(userId: string) {
  const { data: trips } = await supabase
    .from('trips')
    .select('start_date, end_date, destination')
    .eq('user_id', userId)
    .eq('status', 'completed');

  const tripCount = trips?.length ?? 0;
  const daysCount = trips?.reduce((sum, t) => sum + daysBetween(t.start_date, t.end_date), 0) ?? 0;
  const countries = new Set(trips?.map((t) => extractCountry(t.destination)));

  return { tripCount, daysCount, countriesCount: countries.size };
}
```

Para `kilómetros recorridos`, usar la distancia entre origen del usuario (campo en profile o ubicación detectada) y el destino del viaje (geocodificación). Aproximación con fórmula de Haversine.

### 9.4 Mapa mundi con países visitados

Opciones:

**Opción A — react-native-svg con SVG de países**
- Descargar SVG mundial con `id` por país (ISO 3166-1 alpha-2).
- Renderizar como `<Svg>` con `<Path>` por país.
- Aplicar `fill` distinto según visitados/no visitados.
- Pros: control total, sin dependencias pesadas.
- Contras: SVG mundial pesa ~150 KB, requiere optimización.

**Opción B — react-native-maps con polígonos**
- Usar GeoJSON de países y renderizar como polígonos sobre un mapa.
- Pros: interactivo (zoom, pan).
- Contras: más pesado, más lento al renderizar todos los países.

Recomendado: **Opción A** para una versión visual estilo "infografía". El usuario no necesita interactuar con el mapa, solo verlo.

`src/components/VisitedCountriesMap.tsx`:
- Recibe array de códigos ISO de países visitados.
- Renderiza el SVG mundial con esos países coloreados.
- Pinch-to-zoom opcional.

### 9.5 Edición de perfil

`app/(app)/profile/edit.tsx`:
- Campos: avatar, display_name, email (read-only, requiere flujo aparte para cambiar email).
- Botón "Guardar" actualiza la tabla `profiles`.

Para cambiar email: `supabase.auth.updateUser({ email })` → envía email de confirmación.

Para cambiar contraseña: pantalla aparte con campos "actual" y "nueva".

### 9.6 Pantalla de Ajustes

`app/(app)/settings.tsx`:

Lista de opciones agrupadas en secciones:

**Apariencia**
- Tema (claro / oscuro / sistema).

**Preferencias**
- Moneda por defecto (lista de monedas, persiste en `profiles.default_currency`).
- Idioma (es / en por ahora).

**Notificaciones**
- Recordatorio de viaje próximo (toggle).
- Aviso al superar el 80% del presupuesto (toggle).
- Permisos del sistema (botón → ajustes del SO).

**Datos**
- Exportar mis datos (genera JSON con todos los viajes, fotos, gastos).
- Eliminar mi cuenta (con confirmación doble).

**Acerca de**
- Versión de la app.
- Términos y privacidad.
- Licencias open source.

### 9.7 uiStore (Zustand) para tema e idioma

`src/store/uiStore.ts`:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface UIState {
  theme: ThemeMode;
  language: 'es' | 'en';
  setTheme: (t: ThemeMode) => void;
  setLanguage: (l: 'es' | 'en') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'es',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### 9.8 Tema claro/oscuro

`src/constants/theme.ts`:

```typescript
export const lightTheme = {
  background: '#FFFFFF',
  surface: '#F8F8F8',
  text: '#1A1A1A',
  textMuted: '#6B6B6B',
  primary: '#0066CC',
  border: '#E5E5E5',
  // ...
};

export const darkTheme = {
  background: '#0F0F0F',
  surface: '#1A1A1A',
  text: '#FFFFFF',
  textMuted: '#999999',
  primary: '#4A9EFF',
  border: '#2A2A2A',
  // ...
};
```

`src/hooks/useTheme.ts`:
- Lee `useUIStore` y `useColorScheme()` del sistema.
- Devuelve el objeto de colores activo.

Aplicarlo en cada componente con `const colors = useTheme();`.

### 9.9 Internacionalización (i18n)

```bash
npm install i18n-js
npx expo install expo-localization
```

`src/i18n/index.ts`:
```typescript
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import es from './locales/es.json';
import en from './locales/en.json';

export const i18n = new I18n({ es, en });
i18n.locale = Localization.getLocales()[0]?.languageCode ?? 'es';
i18n.enableFallback = true;
```

`src/i18n/locales/es.json`:
```json
{
  "common": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar"
  },
  "trips": {
    "title": "Mis viajes",
    "empty": "Aún no tienes viajes. ¡Crea el primero!"
  }
}
```

Uso: `i18n.t('trips.title')` — o un hook propio `useTranslation()` para cambio reactivo de idioma.

### 9.10 Cerrar sesión y eliminar cuenta

- **Cerrar sesión**: `useAuthStore.getState().signOut()` → vuelve a AuthStack automáticamente.
- **Eliminar cuenta**: requiere una **Edge Function** en Supabase con `service_role` key porque desde cliente no puedes hacer `auth.users.delete`. Pasos:
  1. Edge Function `delete-user` que recibe el JWT, valida, borra el usuario.
  2. Las tablas con CASCADE eliminan el resto automáticamente.
  3. Archivos en Storage hay que borrarlos a mano (o con otra función).

---

## Decisiones técnicas

1. **`zustand/middleware/persist`** — para uiStore. authStore no usa persist (Supabase ya guarda la sesión).
2. **Tema "system" como default** — respeta la preferencia del SO. Override manual disponible.
3. **i18n con `i18n-js` + `expo-localization`** — combo estándar en Expo. Detección automática de idioma del SO al primer arranque.
4. **SVG estático para mapa mundial** — sin JS pesado, sin librerías de mapeo. Suficiente para visualización.
5. **Eliminar cuenta vía Edge Function** — única forma de borrar de `auth.users` desde la app de forma segura.

---

## Verificación / Definition of Done

- [ ] El perfil muestra avatar, nombre y stats correctas.
- [ ] El mapa mundi colorea los países correctos.
- [ ] Cambiar el tema en ajustes se aplica a toda la app sin reinicio.
- [ ] Cambiar el idioma actualiza los textos al instante.
- [ ] La moneda por defecto se aplica al crear nuevos viajes.
- [ ] Editar el perfil actualiza la cabecera al instante.
- [ ] Eliminar cuenta funciona y deja la BD limpia.

## Siguiente fase

→ [Fase 10 — Pulido y lanzamiento](./Fase_10_Pulido_lanzamiento.md)
