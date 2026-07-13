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
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import AuthTextField from '@/components/auth/AuthTextField';
import i18n from '@/i18n';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

function mapAuthError(message?: string): string {
  const m = message ?? '';
  if (m.includes('Invalid login credentials')) return i18n.t('auth.login.errorInvalidCredentials');
  if (m.includes('Email not confirmed')) return i18n.t('auth.login.errorEmailNotConfirmed');
  return i18n.t('auth.login.errorGeneric');
}

export default function LoginScreen() {
  const { t } = useTranslation();
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
      setError(t('auth.login.errorGoogle'));
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleLogin() {
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError(t('auth.login.errorFillFields'));
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
              {t('auth.login.titleStart')}
              <Text style={styles.titleAccent}>{t('auth.login.titleAccent')}</Text>
            </Text>
            <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>
          </View>

          <View style={styles.fields}>
            <AuthTextField
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />

            <View>
              <AuthTextField
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                rightSlot={
                  <TouchableOpacity onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                    <Text style={styles.showText}>
                      {showPassword ? t('auth.hide') : t('auth.show')}
                    </Text>
                  </TouchableOpacity>
                }
              />
              <TouchableOpacity
                style={styles.forgot}
                onPress={() => router.push('./forgot-password')}
                hitSlop={8}
              >
                <Text style={styles.forgotText}>{t('auth.login.forgot')}</Text>
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
                <Text style={styles.primaryText}>{t('auth.login.submit')}</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.divider}>{t('auth.login.divider')}</Text>

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
              <Text style={styles.signupMuted}>{t('auth.login.noAccount')} </Text>
              <TouchableOpacity onPress={() => router.push('/register')} hitSlop={8}>
                <Text style={styles.signupLink}>{t('auth.login.signupLink')}</Text>
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
