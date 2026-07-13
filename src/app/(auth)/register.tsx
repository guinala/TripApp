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

// Candidatos a vivir en un módulo compartido (Perfil/Ajustes los reusará)
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
      // Si NO tienes confirmación de email activada en Supabase, aquí ya hay
      // sesión y el gate de (auth)/_layout redirige solo. Si la tienes activada,
      // no habrá sesión todavía (ver nota abajo).
    } catch (e: any) {
      const m = e?.message ?? '';
      if (/already.*regist/i.test(m)) setEmailTaken(true);
      else if (/Password should be at least/i.test(m)) setError(t('auth.register.errorPasswordMin'));
      else setError(t('auth.register.errorGeneric'));
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

          <TouchableOpacity
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
          </TouchableOpacity>
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
});
