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
import { colors, fontSize, fonts, radius } from '@/constants/theme';
import AuthTextField from '@/components/auth/AuthTextField';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { SelectField, SelectOption } from '@/components/ui/SelectField';
import { useAuthStore } from '@/store/authStore';

// Candidatos a vivir en un módulo compartido
const CURRENCIES: SelectOption[] = [
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'USD ($)', value: 'USD' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'MXN ($)', value: 'MXN' },
  { label: 'ARS ($)', value: 'ARS' },
  { label: 'JPY (¥)', value: 'JPY' },
];

const LANGUAGES: SelectOption[] = [
  { label: 'Español', value: 'es' },
  { label: 'English', value: 'en' },
  { label: 'Français', value: 'fr' },
  { label: 'Português', value: 'pt' },
];

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [language, setLanguage] = useState('es');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('./welcome'));

  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleRegister() {
    setError(null);
    setEmailTaken(false);

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) return setError(t('auth.register.errorName'));
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError(t('auth.register.errorEmail'));
    if (password.length < 6) return setError(t('auth.register.errorPasswordMin'));

    try {
      setLoading(true);
      await signUp({ email: cleanEmail, password, displayName: cleanName, currency, language });
      router.push({
        pathname: '/verify-email',
        params: { email: cleanEmail },
      });
    } catch (e: any) {
      const m = e?.message ?? '';
      if (/already.*regist/i.test(m)) setEmailTaken(true);
      else if (/Password should be at least/i.test(m))
        setError(t('auth.register.errorPasswordMin'));
      else setError(t('auth.register.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
      router.replace('/');
    } catch {
      setError(t('auth.login.errorGoogle'));
    } finally {
      setGoogleLoading(false);
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
              {t('auth.register.titleStart')}
              <Text style={styles.titleAccent}>{t('auth.register.titleAccent')}</Text>
            </Text>
            <Text style={styles.subtitle}>{t('auth.register.subtitle')}</Text>
          </View>

          <View style={styles.fields}>
            <AuthTextField
              label={t('auth.register.name')}
              value={name}
              onChangeText={setName}
              placeholder={t('auth.register.namePlaceholder')}
              autoCapitalize="words"
              autoComplete="name"
            />

            <View>
              <AuthTextField
                label={t('auth.email')}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailTaken) setEmailTaken(false);
                }}
                placeholder={t('auth.emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
              {emailTaken ? (
                <Text style={styles.fieldError}>{t('auth.register.emailTaken')}</Text>
              ) : null}
            </View>

            <View>
              <AuthTextField
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                rightSlot={
                  <TouchableOpacity onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                    <Text style={styles.showText}>
                      {showPassword ? t('auth.hide') : t('auth.show')}
                    </Text>
                  </TouchableOpacity>
                }
              />
              <PasswordStrengthMeter password={password} />
            </View>

            <SelectField
              label={t('auth.register.currency')}
              value={currency}
              options={CURRENCIES}
              onChange={setCurrency}
            />

            <SelectField
              label={t('auth.register.language')}
              value={language}
              options={LANGUAGES}
              onChange={setLanguage}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          {/* <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryText}>{t('auth.register.submit')}</Text>
            )}
          </TouchableOpacity> */}
          {/* Acciones */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryText}>{t('auth.login.submitRegister')}</Text>
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
              <Text style={styles.signupMuted}>{t('auth.login.alreadyAccount')} </Text>
              <TouchableOpacity onPress={() => router.push('/login')} hitSlop={8}>
                <Text style={styles.signupLink}>{t('auth.login.loginLink')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 16 },
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
  header: { marginTop: 16, gap: 6 },
  title: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.textMd,
    color: colors.textPrimary,
  },
  titleAccent: { color: colors.primary },
  subtitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  fields: { marginTop: 24, gap: 18 },
  showText: { fontFamily: fonts.sansSemiBold, fontSize: fontSize.sm, color: colors.primary },
  fieldError: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
    color: colors.danger,
    marginTop: 8,
  },
  error: { fontFamily: fonts.sansMedium, fontSize: fontSize.sm, color: colors.danger },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.white },
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
