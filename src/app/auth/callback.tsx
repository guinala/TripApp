import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';

import { supabase } from '@/services/supabase';
import { colors, fonts, fontSize } from '@/constants/theme';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const url = Linking.useURL() ?? '';

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    async function handleCallback() {
      try {
        const { params, errorCode } = QueryParams.getQueryParams(url);

        if (errorCode) {
          throw new Error(errorCode);
        }

        const accessToken = params.access_token;
        const refreshToken = params.refresh_token;
        const type = params.type;

        if (!accessToken || !refreshToken) {
          throw new Error('El enlace de autenticación no contiene una sesión válida.');
        }

        // Recuperación de contraseña
        if (type === 'recovery') {
          router.replace({
            pathname: '/reset-password',
            params: {
              access_token: accessToken,
              refresh_token: refreshToken,
            },
          });

          return;
        }

        // Registro confirmado / OAuth
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          throw sessionError;
        }

        router.replace('/(app)/(tabs)');
      } catch (e: any) {
        console.error('[AuthCallback] Error procesando callback:', e);

        setError(e?.message ?? 'No se ha podido completar la autenticación.');
      }
    }

    handleCallback();
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
  },

  message: {
    marginTop: 20,
    textAlign: 'center',
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
});
