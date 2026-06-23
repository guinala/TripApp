import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import AuthTextField from '@/components/auth/AuthTextField';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

function mapAuthError(message?: string): string {
  const m = message ?? '';
  if (m.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.';
  if (m.includes('Email not confirmed')) return 'Confirma tu email antes de iniciar sesión.';
  return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
}

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('./welcome'));

  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle() {
    setError(null);
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
    } catch {
      setError('No se pudo continuar con Google. Inténtalo de nuevo.');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleLogin() {
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Rellena email y contraseña.');
      return;
    }

    try {
      setLoading(true);
      await signIn(cleanEmail, password);
    } catch (e: any) {
      setError(mapAuthError(e?.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.7}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>
              Bienvenido{'\n'}
              <Text style={styles.titleAccent}>de vuelta</Text>
            </Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar tu viaje</Text>
          </View>

          <View style={styles.fields}>
            <AuthTextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />

            <View>
              <AuthTextField
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                rightSlot={
                  <TouchableOpacity onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                    <Text style={styles.showText}>{showPassword ? 'Ocultar' : 'Mostrar'}</Text>
                  </TouchableOpacity>
                }
              />
              <TouchableOpacity
                style={styles.forgot}
                onPress={() => router.push('./forgot-password')}
                hitSlop={8}
              >
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <View style={styles.spacer} />

          {/* Acciones */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryText}>Empezar</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.divider}>o continúa con</Text>

            <TouchableOpacity
              style={styles.googleButton}
              activeOpacity={0.85}
              onPress={handleGoogle}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <>
                  <Text style={styles.googleG}>G</Text>
                  <Text style={styles.googleText}>Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={styles.signupMuted}>¿No tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.push('/register')} hitSlop={8}>
                <Text style={styles.signupLink}>Regístrate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceCream },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 8, paddingBottom: 32 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { marginTop: 24, gap: 8 },
  title: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.textMd,
    lineHeight: 44,
    color: colors.textPrimary,
  },
  titleAccent: { color: colors.primary },
  subtitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  fields: { marginTop: 32, gap: 20 },
  showText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  forgot: { alignSelf: 'flex-end', marginTop: 10 },
  forgotText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  error: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
    color: colors.danger,
  },
  spacer: { flex: 1, minHeight: 24 },
  actions: { gap: 16 },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  primaryText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.base,
    color: colors.white,
  },
  divider: {
    textAlign: 'center',
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
    color: colors.textMetadata,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: '#ece2d4',
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  googleG: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.input,
    color: colors.textPrimary,
  },
  googleText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signupMuted: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  signupLink: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
});
