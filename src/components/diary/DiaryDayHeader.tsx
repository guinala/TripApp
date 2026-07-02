import { StyleSheet, Text, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import type { Day } from '@/types/day';

type DiaryDayHeaderProps = {
  day: Day | null; // null = "Sin día asignado"
  photoCount: number;
  destination?: string | null;
};

export function DiaryDayHeader({ day, photoCount, destination }: DiaryDayHeaderProps) {
  const dayLabel = day ? `DÍA ${day.dayNumber}` : 'SIN DÍA ASIGNADO';
  const photoLabel = `${photoCount} ${photoCount === 1 ? 'foto' : 'fotos'}`;

  const title = day
    ? [format(parseISO(day.date), 'd MMM', { locale: es }), destination].filter(Boolean).join(' · ')
    : 'Fotos sueltas';

  return (
    <View style={styles.wrapper}>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{dayLabel}</Text>
        <Text style={styles.meta}>{photoLabel}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.s1 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.nano,
    color: colors.secondary300,
    letterSpacing: 0.2,
  },
  title: { fontFamily: fonts.serifItalic, fontSize: fontSize.title, color: colors.secondary },
});
