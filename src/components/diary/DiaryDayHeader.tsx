import { StyleSheet, Text, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { dateLocale } from '@/i18n/date';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import type { Day } from '@/types/day';

type DiaryDayHeaderProps = {
  day: Day | null;
  photoCount: number;
  destination?: string | null;
};

export function DiaryDayHeader({ day, photoCount, destination }: DiaryDayHeaderProps) {
  const { t } = useTranslation();
  const dayLabel = day
    ? t('itinerary.dayNumber', { number: day.dayNumber }).toUpperCase()
    : t('diary.noDayAssigned').toUpperCase();
  const photoLabel = t('diary.photoCount', { count: photoCount });

  const title = day
    ? [format(parseISO(day.date), 'd MMM', { locale: dateLocale() }), destination]
        .filter(Boolean)
        .join(' · ')
    : t('diary.looseNoDay');

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
