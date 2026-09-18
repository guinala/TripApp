import { LoadNotice } from '@/components/ui/LoadNotice';
import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '@/constants/theme';
import { useTripDetail } from '@/context/TripDetailContext';
import { useExpenseStore } from '@/store/expenseStore';
import { useBudgetSummary } from '@/hooks/use-budget-summary';
import { BudgetSummaryCard } from '@/components/cards/BudgetSummaryCard';
import { CategoryCard } from '@/components/cards/CategoryCard';
import { DayBarChart } from '@/components/cards/DayBarChart';
import { RecentExpenses } from '@/components/budget/RecentExpenses';
import type { Expense } from '@/types/expense';
import { Fab } from '@/components/ui/Fab';
import { useBudgetAlert } from '@/hooks/use-budget-alert';

const EMPTY: Expense[] = [];

export default function BudgetScreen() {
  const { t } = useTranslation();
  const { trip } = useTripDetail();
  const id = trip.id;
  const budget = trip.budget ?? 0;

  const expenses = useExpenseStore((s) => s.byTrip[id] ?? EMPTY);
  const loading = useExpenseStore((s) => s.loadingByTrip[id] ?? false);
  const error = useExpenseStore((s) => s.errorByTrip[id]);
  const loaded = useExpenseStore((s) => s.byTrip[id] !== undefined);
  const loadExpenses = useExpenseStore((s) => s.loadExpenses);

  useFocusEffect(
    useCallback(() => {
      loadExpenses(id);
    }, [id, loadExpenses]),
  );

  const summary = useBudgetSummary(id, budget, trip.currency, trip.startDate, trip.endDate);
  useBudgetAlert(id, summary.percentage);

  const handleAddExpense = () => router.push(`/trips/${id}/expenses/new`);
  const handleViewAll = () => router.push({ pathname: '/trips/[id]/expenses', params: { id } });
  const handleEditExpense = (e: Expense) =>
    router.push({ pathname: '/trips/[id]/expenses/[expenseId]', params: { id, expenseId: e.id } });

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
        <LoadNotice error={!!error} onRetry={() => void loadExpenses(id)} />
        <LoadNotice
          loading={!error && summary.loading}
          error={!error && summary.error}
          message={!error && summary.error ? t('fixes.rateError') : undefined}
          onRetry={summary.retry}
        />
        {!error && loaded && !summary.loading && !summary.error && summary.spent !== null && (
          <>
            <BudgetSummaryCard
              spent={summary.spent ?? 0}
              budget={budget}
              percentage={summary.percentage ?? 0}
              remaining={summary.remaining ?? 0}
              dailyAverage={summary.dailyAverage ?? 0}
              currency={trip.currency}
            />

            <View style={styles.charts}>
              <CategoryCard segments={summary.donutSegments} />
              <DayBarChart byDay={summary.byDay} tripStart={trip.startDate} />
            </View>
          </>
        )}
        {(loaded || expenses.length > 0) && (
          <RecentExpenses
            expenses={expenses}
            tripStart={trip.startDate}
            onViewAll={handleViewAll}
            onEditExpense={handleEditExpense}
            onAddExpense={handleAddExpense}
          />
        )}
      </ScrollView>

      <Fab onPress={handleAddExpense} accessibilityLabel={t('budget.addExpense')} />
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
  charts: { gap: spacing.s2, alignItems: 'stretch' },
});
