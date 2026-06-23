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
import { colors, fontSize, fonts, radius } from '@/constants/theme';
import AuthTextField from '@/components/auth/AuthTextField';
import { useAuthStore } from '@/store/authStore';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const resetPassword = useAuthStore((s) => s.resetPassword);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/login'));

  async function handleSend() {
    setError(null);
    const clean = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(clean)) return setError('Introduce un email válido.');

    try {
      setLoading(true);
      await resetPassword(clean);
      setSent(true);
    } catch {
      setError('No se pudo enviar el correo. Inténtalo de nuevo.');
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
              ¿Olvidaste tu{'\n'}
              <Text style={styles.titleAccent}>contraseña?</Text>
            </Text>
            <Text style={styles.subtitle}>
              Escribe tu email y te enviaremos un enlace para restablecerla.
            </Text>
          </View>

          {sent ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                Si existe una cuenta con ese email, recibirás un correo con el enlace en unos
                minutos. Revisa también la carpeta de spam.
              </Text>
            </View>
          ) : (
            <View style={styles.fields}>
              <AuthTextField
                label="Email"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (error) setError(null);
                }}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSend}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.primaryText}>Enviar enlace</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
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
  fields: { marginTop: 32, gap: 16 },
  notice: {
    marginTop: 32,
    backgroundColor: colors.primary50,
    borderRadius: radius.md,
    padding: 16,
  },
  noticeText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  error: { fontFamily: fonts.sansMedium, fontSize: fontSize.sm, color: colors.danger },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  primaryText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.white },
});
