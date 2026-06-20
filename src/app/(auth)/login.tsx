import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

const ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email o contraseña incorrectos',
  'Email not confirmed': 'Confirma tu email antes de entrar',
  'Email rate limit exceeded': 'Demasiados intentos, espera unos minutos',
};

export default function LoginScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // El layout de (auth) redirige a /(app) al crearse la sesión.
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      setError(ERRORS[msg] ?? 'No se pudo iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>TripMate</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.secondary300}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={colors.secondary300}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Iniciar sesión</Text>
          )}
        </Pressable>

        <Link href="/register" style={styles.link}>
          ¿No tienes cuenta? Regístrate
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceCream },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.s7, gap: spacing.s4 },
  title: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.textSm,
    color: colors.secondary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.body,
    color: colors.secondary300,
    textAlign: 'center',
    marginBottom: spacing.s4,
  },
  input: {
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: colors.secondary100,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s4,
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.input,
    color: colors.secondary,
  },
  error: { fontFamily: fonts.sansRegular, fontSize: fontSize.sm, color: colors.danger },
  info: { fontFamily: fonts.sansRegular, fontSize: fontSize.sm, color: colors.success },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.s5,
    alignItems: 'center',
    marginTop: spacing.s2,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontFamily: fonts.sansBold, fontSize: fontSize.input, color: colors.white },
  link: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.sm,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.s3,
  },
});
