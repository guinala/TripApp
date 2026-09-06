import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors, fontSize, fonts, radius } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/services/supabase';

export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const session = useAuthStore((s) => s.session);

  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Redirigir a la página principal si se detecta que ya hay sesión
  useEffect(() => {
    if (session) {
      router.replace('/');
    }
  }, [session, router]);

  async function handleResend() {
    if (!email) return;
    setResendStatus(null);
    try {
      setResending(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) throw error;
      setResendStatus({
        type: 'success',
        message: t('auth.verifyEmail.resendSuccess'),
      });
    } catch {
      setResendStatus({
        type: 'error',
        message: t('auth.verifyEmail.resendError'),
      });
    } finally {
      setResending(false);
    }
  }

  const goBack = () => router.replace('/login');

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <View style={styles.iconBadge}>
            <Mail size={40} color={colors.primary} />
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>
            {t('auth.verifyEmail.titleStart')}
            <Text style={styles.titleAccent}>{t('auth.verifyEmail.titleAccent')}</Text>
          </Text>
          <Text style={styles.subtitle}>{t('auth.verifyEmail.subtitle')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.noticeText}>{t('auth.verifyEmail.sentNotice')}</Text>
          {email ? <Text style={styles.emailHighlight}>{email}</Text> : null}

          <View style={styles.badgeBox}>
            <Text style={styles.badgeText}>⚠️ Confirma la verificación de email</Text>
          </View>

          <Text style={styles.spamText}>{t('auth.verifyEmail.checkSpam')}</Text>
        </View>

        {resendStatus ? (
          <Text
            style={[
              styles.statusMessage,
              resendStatus.type === 'error' ? styles.statusError : styles.statusSuccess,
            ]}
          >
            {resendStatus.message}
          </Text>
        ) : null}

        <View style={styles.spacer} />

        <View style={styles.actions}>
          {email ? (
            <TouchableOpacity
              style={[styles.resendButton, resending && styles.buttonDisabled]}
              onPress={handleResend}
              activeOpacity={0.85}
              disabled={resending}
            >
              {resending ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <RefreshCw size={18} color={colors.primary} />
                  <Text style={styles.resendText}>{t('auth.verifyEmail.resend')}</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goBack}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryText}>{t('auth.verifyEmail.backToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceCream },
  scroll: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 8, paddingBottom: 32 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { marginTop: 24, gap: 8, alignItems: 'center' },
  title: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.textMd,
    lineHeight: 40,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  titleAccent: { color: colors.primary },
  subtitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    marginTop: 24,
    backgroundColor: colors.surfacePaper,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ece2d4',
    gap: 12,
  },
  noticeText: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  emailHighlight: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.base,
    color: colors.primary,
  },
  badgeBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  badgeText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.sm,
    color: '#B45309',
    textAlign: 'center',
  },
  spamText: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.label,
    color: colors.textMetadata,
    lineHeight: 18,
  },
  statusMessage: {
    marginTop: 16,
    textAlign: 'center',
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
  },
  statusSuccess: { color: colors.success },
  statusError: { color: colors.danger },
  spacer: { flex: 1, minHeight: 32 },
  actions: { gap: 12 },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surfacePaper,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  resendText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.base,
    color: colors.primary,
  },
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
});
