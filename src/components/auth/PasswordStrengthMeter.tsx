import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fontSize, fonts } from '@/constants/theme';

const SEGMENTS = 4;

type Strength = { score: number; labelKey: string; color: string };

export function getPasswordStrength(password: string): Strength {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels: Strength[] = [
    { score: 0, labelKey: '', color: 'transparent' },
    { score: 1, labelKey: 'auth.strength.weak', color: colors.danger },
    { score: 2, labelKey: 'auth.strength.medium', color: colors.warning },
    { score: 3, labelKey: 'auth.strength.strong', color: colors.success },
    { score: 4, labelKey: 'auth.strength.veryStrong', color: colors.success },
  ];
  return levels[score];
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { t } = useTranslation();
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.bars}>
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { backgroundColor: i < strength.score ? strength.color : colors.surfaceAlt },
            ]}
          />
        ))}
      </View>
      <Text style={styles.label}>
        {t('auth.strength.title')}{' '}
        <Text style={[styles.labelValue, { color: strength.color }]}>
          {strength.labelKey ? t(strength.labelKey) : ''}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6, marginTop: 8 },
  bars: { flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.label,
    color: colors.textSecondary,
  },
  labelValue: { fontFamily: fonts.sansBold },
});
