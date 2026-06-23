import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fonts } from '@/constants/theme';

const SEGMENTS = 4;

type Strength = { score: number; label: string; color: string };

export function getPasswordStrength(password: string): Strength {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels: Strength[] = [
    { score: 0, label: '', color: 'transparent' },
    { score: 1, label: 'débil', color: colors.danger },
    { score: 2, label: 'media', color: colors.warning },
    { score: 3, label: 'fuerte', color: colors.success },
    { score: 4, label: 'muy fuerte', color: colors.success },
  ];
  return levels[score];
}

export function PasswordStrengthMeter({ password }: { password: string }) {
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
        Fuerza: <Text style={[styles.labelValue, { color: strength.color }]}>{strength.label}</Text>
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
