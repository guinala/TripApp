import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PlacesScreen } from '@/components/explore/PlacesUI';
import { LoadNotice } from '@/components/ui/LoadNotice';
import { useTripRecord } from '@/hooks/use-trip-record';
import { ensureDays } from '@/services/days';
import { getExpense } from '@/services/expenses';
import { accountVersion } from '@/services/account-session';
import type { Day } from '@/types/day';
import type { Expense } from '@/types/expense';
import { ExpenseEditor } from './ExpenseEditor';

export function ExpenseRoute({ edit = false }: { edit?: boolean }) {
  const { t } = useTranslation();
  const { id, expenseId } = useLocalSearchParams<{ id: string; expenseId?: string }>();
  const { trip, loading: tripLoading, error: tripError, retry: retryTrip } = useTripRecord(id);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    retryTrip();
    setAttempt((n) => n + 1);
  }, [retryTrip]);
  const key = JSON.stringify([trip, expenseId, edit, attempt]);
  const [result, setResult] = useState<{
    key: string;
    days: Day[];
    expense?: Expense;
    error: boolean;
    missing: boolean;
  } | null>(null);

  useEffect(() => {
    if (!trip) return;
    let cancelled = false;
    const started = accountVersion();
    void Promise.all([
      ensureDays(trip),
      edit && expenseId ? getExpense(trip.id, expenseId) : Promise.resolve(null),
    ]).then(
      ([days, expense]) => {
        if (!cancelled && started === accountVersion())
          setResult({
            key,
            days,
            expense: expense ?? undefined,
            error: false,
            missing: edit && !expense,
          });
      },
      () => {
        if (!cancelled) setResult({ key, days: [], error: true, missing: false });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [trip, expenseId, edit, key]);

  const current = result?.key === key ? result : null;

  return (
    <PlacesScreen title={t(edit ? 'fixes.editExpense' : 'expense.title')}>
      <LoadNotice
        loading={tripLoading || (!!trip && !current)}
        error={!!tripError || !!current?.error}
        onRetry={retry}
      />
      {((!trip && !tripLoading && !tripError) || current?.missing) && (
        <LoadNotice message={t('fixes.notFound')} />
      )}
      {trip && current && !current.error && !current.missing && (
        <ExpenseEditor
          key={expenseId ?? id}
          trip={trip}
          days={current.days}
          expense={current.expense}
        />
      )}
    </PlacesScreen>
  );
}
