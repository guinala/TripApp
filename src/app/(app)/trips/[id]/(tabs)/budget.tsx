// app/(app)/trips/[id]/budget.tsx
import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '@/constants/theme';
import { useTripStore } from '@/store/tripStore';
import { useExpenseStore } from '@/store/expenseStore';
import { useBudgetSummary } from '@/hooks/use-budget-summary';
import { BudgetSummaryCard } from '@/components/cards/BudgetSummaryCard';
import { CategoryCard } from '@/components/cards/CategoryCard';
import { DayBarChart } from '@/components/cards/DayBarChart';
import { RecentExpenses } from '@/components/budget/RecentExpenses';
import type { Expense } from '@/types/expense';
import { Fab } from '@/components/Fab';

const EMPTY: Expense[] = [];

export default function BudgetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const trip = useTripStore((s) => s.trips.find((t) => t.id === id));
  const expenses = useExpenseStore((s) => s.byTrip[id] ?? EMPTY);
  const loading = useExpenseStore((s) => s.loadingByTrip[id] ?? false);
  const loadExpenses = useExpenseStore((s) => s.loadExpenses);

  useFocusEffect(
    useCallback(() => {
      loadExpenses(id);
    }, [id, loadExpenses]),
  );

  const summary = useBudgetSummary(
    id,
    trip?.budget ?? 0,
    trip?.currency ?? 'EUR',
    trip?.startDate,
    trip?.endDate,
  );

  const handleAddExpense = () => router.push(`/trips/${id}/expenses/new`);
  const handleViewAll = () => router.push(`./trips/${id}/expenses`);
  const handleEditExpense = (e: Expense) => router.push(`./trips/${id}/expenses/${e.id}`);

  if (loading && expenses.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BudgetSummaryCard
          spent={summary.spent ?? 0}
          budget={trip?.budget ?? 0}
          percentage={summary.percentage ?? 0}
          remaining={summary.remaining ?? 0}
          dailyAverage={summary.dailyAverage ?? 0}
          currency={trip?.currency ?? 'EUR'}
        />

        <View style={styles.charts}>
          <CategoryCard segments={summary.donutSegments} />
          <DayBarChart byDay={summary.byDay} tripStart={trip?.startDate} />
        </View>

        <RecentExpenses
          expenses={expenses}
          tripStart={trip?.startDate}
          onViewAll={handleViewAll}
          onEditExpense={handleEditExpense}
          onAddExpense={handleAddExpense}
        />
      </ScrollView>

      <Fab onPress={handleAddExpense} accessibilityLabel="Añadir gasto" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceCream },
  content: { padding: spacing.s5, gap: spacing.s3, paddingBottom: 120 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceCream,
  },
  charts: { flexDirection: 'row', gap: spacing.s2, alignItems: 'stretch' },
});
