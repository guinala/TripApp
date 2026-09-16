// src/app/auth/callback.tsx
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';

import { supabase } from '@/services/supabase';
import { colors, fonts, fontSize } from '@/constants/theme';

const TIMEOUT_MS = 10000;

export default function AuthCallbackScreen() {
  const router = useRouter();
  const url = Linking.useLinkingURL() ?? '';

  const [error, setError] = useState<string | null>(null);

  const processedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!url) return;

    // Si Expo Router/Linking entrega la misma URL otra vez,
    // no se vuelve a procesar
    if (processedUrlRef.current === url) {
      return;
    }

    processedUrlRef.current = url;

    let cancelled = false;

    async function handleCallback() {
      const timeoutId = setTimeout(() => {
        if (!cancelled) {
          setError(
            'La autenticación está tardando demasiado. Cierra esta pantalla e inténtalo de nuevo.',
          );
        }
      }, TIMEOUT_MS);

      try {
        const { params, errorCode } = QueryParams.getQueryParams(url);

        if (errorCode) {
          throw new Error(errorCode);
        }

        const type = params.type;

        let accessToken = params.access_token;
        let refreshToken = params.refresh_token;

        if (!accessToken || !refreshToken) {
          const code = params.code;

          if (code) {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
              throw exchangeError;
            }

            if (!data.session) {
              throw new Error('Supabase no ha devuelto una sesión válida.');
            }

            accessToken = data.session.access_token;
            refreshToken = data.session.refresh_token;
          }
        }

        if (!accessToken || !refreshToken) {
          throw new Error('El enlace de autenticación no contiene datos válidos.');
        }

        // Recovery
        if (type === 'recovery') {
          if (cancelled) return;

          router.replace({
            pathname: '/reset-password',
            params: {
              access_token: accessToken,
              refresh_token: refreshToken,
            },
          });

          return;
        }

        // Setear sesion en supabase
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          throw sessionError;
        }

        if (cancelled) return;

        // Mandar al usuario a aplicacion
        router.replace('/(app)/(tabs)');
      } catch (e: any) {
        console.error('[AuthCallback] Error procesando callback:', e);

        if (!cancelled) {
          setError(e?.message ?? 'No se ha podido completar la autenticación.');
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, [url, router]);

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text style={styles.title}>Ha ocurrido un problema</Text>

          <Text style={styles.message}>{error}</Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={colors.primary} />

          <Text style={styles.message}>Completando autenticación...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.surfaceCream,
  },

  title: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.textMd,
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },

  message: {
    marginTop: 20,
    textAlign: 'center',
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
});
