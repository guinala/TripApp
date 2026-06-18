import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { categoryColors, colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import type { Activity, ActivityCategory } from '@/types/activity';

const CATEGORY_ICON: Record<ActivityCategory, keyof typeof Ionicons.glyphMap> = {
  visit: 'camera',
  restaurant: 'restaurant',
  transport: 'airplane',
  hotel: 'bed',
  entertainment: 'musical-notes',
  others: 'ellipsis-horizontal',
};

function withAlpha(hex: string, opacity: number): string {
  const a = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

export function ActivityCard({ activity }: { activity: Activity }) {
  const tint = categoryColors[activity.category];
  const subtitle = activity.notes ?? activity.address;

  return (
    <View style={styles.card}>
      <Text style={styles.hour}>{activity.time ?? '--:--'}</Text>

      <View style={[styles.iconBox, { backgroundColor: withAlpha(tint, 0.15) }]}>
        <Ionicons name={CATEGORY_ICON[activity.category]} size={20} color={tint} />
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {activity.title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <MaterialCommunityIcons name="drag-vertical" size={20} color={colors.secondary300} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s4,
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: colors.textSubtitle,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s4,
  },
  hour: {
    width: 46,
    fontFamily: fonts.sansBold,
    fontSize: fontSize.base,
    color: colors.secondary,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: spacing.s1 },
  title: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.secondary },
  subtitle: { fontFamily: fonts.sansRegular, fontSize: fontSize.label, color: colors.secondary300 },
});
