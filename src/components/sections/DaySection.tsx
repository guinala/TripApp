import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { ActivityCard } from '@/components/cards/ActivityCard';
import type { Activity } from '@/types/activity';
import type { Day } from '@/types/day';

export function DaySection({ day, activities }: { day: Day; activities: Activity[] }) {
  const label = `DÍA ${day.dayNumber} · ${format(parseISO(day.date), 'EEE d MMM', { locale: es }).toUpperCase()}`;
  const count = activities.length;

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      {day.title ? <Text style={styles.title}>{day.title}</Text> : null}
      <Text style={styles.amount}>
        {count} {count === 1 ? 'actividad' : 'actividades'}
      </Text>

      <View style={styles.cards}>
        {activities.map((a) => (
          <ActivityCard key={a.id} activity={a} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: spacing.s4, gap: spacing.s2 },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.label,
    color: colors.secondary300,
    letterSpacing: 0.5,
  },
  title: { fontFamily: fonts.serifItalic, fontSize: fontSize.title, color: colors.secondary },
  amount: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.label,
    color: colors.secondary300,
    textAlign: 'right',
  },
  cards: { gap: spacing.s2 },
});
