# Fase 2 — Autenticación

## Objetivo

Implementar login y registro de usuarios con Supabase Auth, persistir la sesión entre arranques de la app, y exponer el estado del usuario logueado al resto de la aplicación mediante un store global.

## Prerrequisitos

- Fase 1 completada (cliente de Supabase configurado, tabla `profiles` con trigger).

## Tareas

### 2.1 Crear el authStore con Zustand

`src/store/authStore.ts`:

```typescript
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,

  initialize: async () => {
    const { data } = await supabase.auth.getSession();
    set({ session: data.session, user: data.session?.user ?? null, loading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUp: async (email, password, displayName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },
}));
```

Puntos clave:
- `initialize()` se llama una sola vez al arrancar la app. Lee la sesión guardada en AsyncStorage y suscribe el listener de cambios.
- `onAuthStateChange` se dispara automáticamente con login, logout, refresco de token, etc. No hace falta llamarlo manualmente.
- `display_name` se pasa en `options.data`, que va a `raw_user_meta_data` y lo recoge nuestro trigger para crear el profile.

### 2.2 Inicializar el store al arrancar

Editar `app/_layout.tsx` para llamar a `initialize()` al montar:

```tsx
import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
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

> Configura el alias `@/` apuntando a `src/` en `tsconfig.json` para tener imports limpios:
> ```json
> { "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["src/*"] } } }
> ```

### 2.3 Pantalla de carga inicial

No hace falta una pantalla de Splash separada como ruta. El "splash" lo gestionará el layout de `(app)` mostrando un `ActivityIndicator` mientras `loading` es `true` en el authStore. Más adelante (Fase 10) configuraremos el splash nativo de Expo en `app.json` para que cubra el arranque frío de la app.

### 2.4 Pantalla de Login

`app/(auth)/login.tsx`:
- Inputs de email y password (con `secureTextEntry`).
- Botón "Iniciar sesión" que llama a `signIn` del store.
- Estado local `loading` mientras la promesa está pendiente.
- Manejo de errores: traducir mensajes de Supabase a textos en español.
- Link "¿No tienes cuenta? Regístrate" → `router.push('/register')`.
- (Más adelante) Botón "Continuar con Google".

```tsx
import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
// ...

export default function LoginScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const router = useRouter();
  // El layout de (auth) ya nos redirige a /(app) cuando se crea la sesión,
  // no hace falta router.replace aquí.
  // ...
}
```

Mapeo de errores comunes:
| Mensaje Supabase | Texto al usuario |
|---|---|
| `Invalid login credentials` | Email o contraseña incorrectos |
| `Email not confirmed` | Confirma tu email antes de entrar |
| `Email rate limit exceeded` | Demasiados intentos, espera unos minutos |

### 2.5 Pantalla de Registro

`app/(auth)/register.tsx`:
- Inputs: nombre visible, email, password, confirmar password.
- Validación cliente: email con regex básica, password mínimo 8 caracteres, ambas iguales.
- Llama a `signUp` del store.
- Mostrar mensaje "Te hemos enviado un correo para confirmar tu cuenta" (si tienes confirmación email activada en Supabase Auth → Settings).
- Link "¿Ya tienes cuenta? Inicia sesión" → `router.back()` o `<Link href="/login">`.

### 2.6 Configurar confirmación de email (decisión)

En **Authentication → Settings → Sign In / Up**:
- **Enable email confirmations:** decidir si activar.
  - **Activado** (recomendado para producción): el usuario recibe un email y no puede usar la app hasta confirmar. Más seguro.
  - **Desactivado**: registro instantáneo. Más cómodo en desarrollo.

Para desarrollo personal, desactivado está bien. Cuando vayas a publicar, activar.

### 2.7 Google Sign-In (opcional en esta fase)

Requiere configuración en Google Cloud Console + Supabase + nativo. Es más laborioso y se puede dejar para más adelante. Pasos resumidos cuando lo abordes:

1. En **Google Cloud Console**: crear proyecto, OAuth consent screen, credenciales OAuth para iOS, Android y Web.
2. En **Supabase → Authentication → Providers → Google**: pegar Client ID y Client Secret.
3. En la app: usar `expo-auth-session/providers/google` con `WebBrowser.maybeCompleteAuthSession()`.
4. Pasar el `id_token` a `supabase.auth.signInWithIdToken({ provider: 'google', token })`.

### 2.8 Layouts con gate de sesión

En lugar de un componente `AuthGate` único, Expo Router resuelve el switch con dos layouts, uno por grupo.

`app/(auth)/_layout.tsx` — si ya hay sesión, redirige al área autenticada:

```tsx
import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function AuthLayout() {
  const session = useAuthStore((s) => s.session);

  if (session) return <Redirect href="/(app)" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
```

`app/(app)/_layout.tsx` — muestra spinner mientras carga, redirige a login si no hay sesión:

```tsx
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '@/store/authStore';

export default function AppLayout() {
  const { session, loading } = useAuthStore();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="trips/[id]" />
    </Stack>
  );
}
```

Cuando se ejecuta `signIn` desde Login, el `session` del store cambia, el `(auth)/_layout` reacciona y redirige automáticamente a `/(app)`. Cuando se llama a `signOut`, ocurre lo contrario. No hace falta navegación imperativa.

---

## Decisiones técnicas

1. **Persistencia automática vía AsyncStorage** — configurada ya en el cliente de Supabase. No requiere lógica adicional.
2. **Auth gate vía layouts de Expo Router** — el switch entre `(auth)` y `(app)` se hace declarativamente con `<Redirect>` en cada `_layout.tsx`. Cuando cambia la sesión en el store, los layouts reaccionan automáticamente. Más limpio que la navegación imperativa.
3. **`onAuthStateChange` como única fuente de verdad** — cualquier cambio en la sesión (login, logout, refresco) actualiza el store automáticamente. No mantenemos copias paralelas del estado.
4. **Validación cliente + servidor** — la validación de formularios en cliente es solo UX. La seguridad real la impone Supabase Auth (longitud mínima de password, formato email, etc.).

---

## Verificación / Definition of Done

- [ ] Registrar un usuario nuevo desde la app y verificar que aparece en `auth.users` y `profiles` de Supabase.
- [ ] Tras registrarse o iniciar sesión, la app navega automáticamente a `/(app)/(tabs)` (aunque aún esté vacío).
- [ ] Cerrar y reabrir la app: el usuario sigue logueado (persistencia funcionando).
- [ ] Logout devuelve a la pantalla de login automáticamente.
- [ ] Intentar login con credenciales inválidas muestra un error claro al usuario.
- [ ] El spinner de carga se ve solo durante el check inicial, sin parpadeos.

## Siguiente fase

→ [Fase 3 — Mis viajes (CRUD)](./Fase_03_Mis_viajes.md)
