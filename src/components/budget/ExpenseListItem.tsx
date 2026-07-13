import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { colors, expenseCategoryColors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { EXPENSE_ICON } from '@/constants/expenseIcons';
import { formatCurrency } from '@/utils/currency';
import { dateLocale } from '@/i18n/date';
import { format, parseISO } from 'date-fns';
import type { Expense } from '@/types/expense';

function withAlpha(hex: string, opacity: number): string {
  const a = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

function tripDayLabel(date: string, t: TFunction, tripStart?: string): string {
  if (!tripStart) {
    return format(parseISO(date), 'd MMM', { locale: dateLocale() });
  }
  const MS = 86_400_000;
  const n = Math.floor((new Date(date).getTime() - new Date(tripStart).getTime()) / MS) + 1;
  return t('itinerary.dayNumber', { number: n });
}

type ExpenseListItemProps = {
  expense: Expense;
  tripStart?: string;
  onPress?: () => void;
};

export function ExpenseListItem({ expense, tripStart, onPress }: ExpenseListItemProps) {
  const { t } = useTranslation();
  const tint = expenseCategoryColors[expense.category];

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.day}>{tripDayLabel(expense.date, t, tripStart)}</Text>

      <View style={[styles.iconBox, { backgroundColor: withAlpha(tint, 0.15) }]}>
        <Ionicons name={EXPENSE_ICON[expense.category]} size={20} color={tint} />
      </View>

      <View style={styles.info}>
        <Text style={styles.amount}>{formatCurrency(expense.amount, expense.currency)}</Text>
        {expense.description ? (
          <Text style={styles.desc} numberOfLines={1}>
            {expense.description}
          </Text>
        ) : null}
      </View>

      <Ionicons name="pencil" size={18} color={colors.secondary300} />
    </Pressable>
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
  day: {
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
  amount: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.secondary },
  desc: { fontFamily: fonts.sansRegular, fontSize: fontSize.label, color: colors.secondary300 },
});
