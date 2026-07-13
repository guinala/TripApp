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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, fontSize, fonts, radius } from '@/constants/theme';
import AuthTextField from '@/components/auth/AuthTextField';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { supabase } from '@/services/supabase';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { access_token, refresh_token } = useLocalSearchParams<{
    access_token?: string;
    refresh_token?: string;
  }>();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate() {
    setError(null);
    if (password.length < 6) return setError(t('auth.register.errorPasswordMin'));
    if (password !== confirm) return setError(t('auth.reset.errorMismatch'));
    if (!access_token || !refresh_token) {
      return setError(t('auth.reset.errorInvalidLink'));
    }

    try {
      setLoading(true);
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (sessionError) throw sessionError;

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      router.replace('./(app)');
    } catch {
      setError(t('auth.reset.errorUpdate'));
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
          <View style={styles.header}>
            <Text style={styles.title}>
              {t('auth.reset.titleStart')}
              <Text style={styles.titleAccent}>{t('auth.reset.titleAccent')}</Text>
            </Text>
            <Text style={styles.subtitle}>{t('auth.reset.subtitle')}</Text>
          </View>

          <View style={styles.fields}>
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

            <AuthTextField
              label={t('auth.reset.confirmLabel')}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password-new"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleUpdate}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryText}>{t('auth.reset.submit')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceCream },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 24, paddingBottom: 32 },
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
  showText: { fontFamily: fonts.sansSemiBold, fontSize: fontSize.sm, color: colors.primary },
  error: { fontFamily: fonts.sansMedium, fontSize: fontSize.sm, color: colors.danger },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.white },
});
