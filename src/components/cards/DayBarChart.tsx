import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import type { DayBreakdown } from '@/hooks/use-budget-summary';

const CHART_HEIGHT = 100;
const BAR_WIDTH = 8;
const MIN_BAR = 4;

interface Props {
  byDay: DayBreakdown[];
  tripStart?: string; // YYYY-MM-DD
}

function dayNumber(date: string, index: number, tripStart?: string): number {
  if (!tripStart) return index + 1;
  const MS = 86_400_000;
  const diff = new Date(date).getTime() - new Date(tripStart).getTime();
  return Math.floor(diff / MS) + 1;
}

export function DayBarChart({ byDay, tripStart }: Props) {
  const { t } = useTranslation();
  const max = byDay.reduce((m, d) => Math.max(m, d.amount), 0);

  const lastIdx = byDay.length - 1;
  const midIdx = Math.floor(lastIdx / 2);
  const labelIdxs = [...new Set([0, midIdx, lastIdx])].filter((i) => i >= 0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('budget.byDay').toUpperCase()}</Text>

      <View style={styles.chart}>
        {byDay.map((d) => {
          const h =
            max > 0 ? Math.max((d.amount / max) * CHART_HEIGHT, d.amount > 0 ? MIN_BAR : 0) : 0;
          const isMax = d.amount === max && max > 0;
          return (
            <View
              key={d.date}
              style={[
                styles.bar,
                { height: h, backgroundColor: isMax ? colors.primary : colors.primary100 },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.labels}>
        {labelIdxs.map((i, pos) => (
          <Text
            key={i}
            style={[
              styles.label,
              { textAlign: pos === 0 ? 'left' : pos === labelIdxs.length - 1 ? 'right' : 'center' },
            ]}
          >
            {t('itinerary.dayFilter.day', { number: dayNumber(byDay[i].date, i, tripStart) })}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: colors.accent100,
    borderRadius: radius.xl,
    paddingVertical: 10,
    gap: 10,
    overflow: 'hidden',
  },
  title: {
    fontFamily: fonts.sansExtraBold,
    fontSize: fontSize.micro,
    color: colors.textMetadata,
    textAlign: 'center',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: CHART_HEIGHT,
    gap: 5,
    paddingHorizontal: 11,
  },
  bar: {
    width: BAR_WIDTH,
    maxWidth: BAR_WIDTH,
    borderRadius: radius.xl2,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  label: {
    flex: 1,
    fontFamily: fonts.sansExtraBold,
    fontSize: fontSize.nano,
    color: colors.textMetadata,
  },
});
