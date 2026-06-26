import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { ExpenseListItem } from './ExpenseListItem';
import type { Expense } from '@/types/expense';
import { Ionicons } from '@expo/vector-icons';

type RecentExpensesProps = {
  expenses: Expense[];
  tripStart?: string;
  limit?: number;
  onViewAll?: () => void;
  onEditExpense?: (expense: Expense) => void;
  onAddExpense?: () => void;
};

export function RecentExpenses({
  expenses,
  tripStart,
  limit = 5,
  onViewAll,
  onEditExpense,
  onAddExpense,
}: RecentExpensesProps) {
  const recent = expenses.slice(0, limit);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>
          <Text style={styles.titleDark}>Últimos </Text>
          <Text style={styles.titleAccent}>Gastos</Text>
        </Text>
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={styles.link}>Ver todos los gastos</Text>
        </Pressable>
      </View>

      {recent.length === 0 ? (
        <Pressable style={styles.emptyCta} onPress={onAddExpense} hitSlop={8}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.emptyCtaText}>Añade tu primer gasto</Text>
        </Pressable>
      ) : (
        <View style={styles.cards}>
          {recent.map((e) => (
            <ExpenseListItem
              key={e.id}
              expense={e}
              tripStart={tripStart}
              onPress={() => onEditExpense?.(e)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.s3 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontFamily: fonts.serifItalic, fontSize: fontSize.title },
  titleDark: { color: colors.textPrimary },
  titleAccent: { color: colors.primary },
  link: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.label,
    color: colors.primary,
  },
  empty: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.label,
    color: colors.secondary300,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
    paddingVertical: spacing.s4,
  },
  emptyCtaText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.label,
    color: colors.primary,
  },
  cards: {
    gap: spacing.s2,
  },
});
