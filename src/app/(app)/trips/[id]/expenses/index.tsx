import { useCallback } from 'react';
import { FlatList } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PlacesScreen, PlacesButton } from '@/components/explore/PlacesUI';
import { LoadNotice } from '@/components/ui/LoadNotice';
import { ExpenseListItem } from '@/components/budget/ExpenseListItem';
import { useExpenseStore } from '@/store/expenseStore';
import type { Expense } from '@/types/expense';

const EMPTY: Expense[] = [];

export default function ExpensesScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const expenses = useExpenseStore((s) => s.byTrip[id] ?? EMPTY);
  const loading = useExpenseStore((s) => s.loadingByTrip[id] ?? false);
  const error = useExpenseStore((s) => s.errorByTrip[id]);
  const loaded = useExpenseStore((s) => s.byTrip[id] !== undefined);
  const load = useExpenseStore((s) => s.loadExpenses);

  useFocusEffect(
    useCallback(() => {
      void load(id);
    }, [id, load]),
  );

  return (
    <PlacesScreen title={t('fixes.allExpenses')} scroll={false}>
      <LoadNotice loading={!loaded && loading} error={!!error} onRetry={() => void load(id)} />
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
        refreshing={loading}
        onRefresh={() => void load(id)}
        ListHeaderComponent={
          <PlacesButton
            title={t('budget.addExpense')}
            onPress={() => router.push({ pathname: '/trips/[id]/expenses/new', params: { id } })}
          />
        }
        ListEmptyComponent={
          !loading && !error && loaded ? <LoadNotice message={t('fixes.noExpenses')} /> : null
        }
        renderItem={({ item }) => (
          <ExpenseListItem
            expense={item}
            showEditAction
            onPress={() =>
              router.push({
                pathname: '/trips/[id]/expenses/[expenseId]',
                params: { id, expenseId: item.id },
              })
            }
          />
        )}
      />
    </PlacesScreen>
  );
}
