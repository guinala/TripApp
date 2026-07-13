import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '@/constants/theme';

type SettingsRowProps = {
  title: string;
  subtitle?: string;
  value?: string;
  variant?: 'chevron' | 'external' | 'danger' | 'plain';
  right?: ReactNode; // ej: <Toggle />
  onPress?: () => void;
};

export function SettingsRow({
  title,
  subtitle,
  value,
  variant = 'plain',
  right,
  onPress,
}: SettingsRowProps) {
  const content = (
    <View style={styles.row}>
      <View style={styles.texts}>
        <Text style={[styles.title, variant === 'danger' && styles.danger]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {right}
      {variant === 'chevron' && (
        <Ionicons name="chevron-forward" size={15} color={colors.secondary300} />
      )}
      {variant === 'external' && (
        <Ionicons name="arrow-up" size={14} color={colors.primary} style={styles.external} />
      )}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  pressed: { opacity: 0.7 },
  texts: { flex: 1, gap: 3 },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  danger: { color: '#C84A2E' },
  subtitle: { fontFamily: fonts.sansRegular, fontSize: 11, color: '#8A95AC' },
  value: { fontFamily: fonts.sansMedium, fontSize: 13, color: '#4F5F7E' },
  external: { transform: [{ rotate: '45deg' }] },
});
