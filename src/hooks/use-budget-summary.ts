import { useEffect, useMemo, useState } from 'react';
import type { Expense, ExpenseCategory } from '@/types/expense';
import { useExpenseStore } from '@/store/expenseStore';
import { calculateTotalInCurrency } from '@/utils/calculateTotal';

const EMPTY: Expense[] = [];

export type BudgetStatus = 'safe' | 'caution' | 'warning' | 'over';

export type DonutSegmentKey = ExpenseCategory | 'remaining';

export type DonutSegment = {
  key: DonutSegmentKey;
  amount: number;
  percentage: number;
};

export type CategoryBreakdown = {
  category: ExpenseCategory;
  amount: number;
};

export type DayBreakdown = {
  date: string; // YYYY-MM-DD
  amount: number;
};

export interface BudgetSummary {
  loading: boolean;
  spent: number | null;
  remaining: number | null;
  percentage: number | null;
  status: BudgetStatus;
  dailyAverage: number | null;
  byCategory: CategoryBreakdown[];
  donutSegments: DonutSegment[];
  byDay: DayBreakdown[];
}

export function getBudgetStatus(percentage: number | null): BudgetStatus {
  if (percentage === null) return 'safe';
  if (percentage > 100) return 'over';
  if (percentage > 80) return 'warning';
  if (percentage > 60) return 'caution';
  return 'safe';
}

function elapsedTripDays(start?: string, end?: string): number | null {
  if (!start) return null;
  const MS = 86_400_000;
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  const nowMs = Date.now();
  const clamped = Math.min(Math.max(nowMs, startMs), endMs);
  return Math.max(1, Math.floor((clamped - startMs) / MS) + 1);
}

async function breakdownBy<K extends string>(
  expenses: Expense[],
  keyOf: (e: Expense) => K,
  targetCurrency: string,
): Promise<{ key: K; amount: number }[]> {
  const groups = new Map<K, Expense[]>();
  for (const e of expenses) {
    const k = keyOf(e);
    const arr = groups.get(k);
    if (arr) arr.push(e);
    else groups.set(k, [e]);
  }

  const entries = [...groups.entries()];
  const amounts = await Promise.all(
    entries.map(([, list]) => calculateTotalInCurrency(list, targetCurrency)),
  );

  return entries.map(([key], i) => ({ key, amount: amounts[i] }));
}

export function useBudgetSummary(
  tripId: string,
  budget: number,
  tripCurrency: string,
  tripStart?: string,
  tripEnd?: string,
): BudgetSummary {
  const expenses = useExpenseStore((s) => s.byTrip[tripId] ?? EMPTY);

  const [loading, setLoading] = useState(false);
  const [spent, setSpent] = useState<number | null>(null);
  const [byCategory, setByCategory] = useState<CategoryBreakdown[]>([]);
  const [byDay, setByDay] = useState<DayBreakdown[]>([]);

  useEffect(() => {
    if (expenses.length === 0) {
      setSpent(0);
      setByCategory([]);
      setByDay([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const [total, cats, days] = await Promise.all([
          calculateTotalInCurrency(expenses, tripCurrency),
          breakdownBy(expenses, (e) => e.category, tripCurrency),
          breakdownBy(expenses, (e) => e.date, tripCurrency),
        ]);

        if (cancelled) return;

        setSpent(total);
        setByCategory(
          cats
            .map((c) => ({ category: c.key as ExpenseCategory, amount: c.amount }))
            .sort((a, b) => b.amount - a.amount),
        );
        setByDay(
          days
            .map((d) => ({ date: d.key, amount: d.amount }))
            .sort((a, b) => a.date.localeCompare(b.date)),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [expenses, tripCurrency]);

  return useMemo(() => {
    const percentage = spent !== null && budget > 0 ? (spent / budget) * 100 : null;
    const remaining = spent !== null ? budget - spent : null;

    const days = elapsedTripDays(tripStart, tripEnd) ?? (byDay.length || 1);
    const dailyAverage = spent !== null ? spent / days : null;

    const donutSegments: DonutSegment[] = [];
    if (spent !== null) {
      const overBudget = spent > budget;
      const denom = overBudget ? spent : budget;
      if (denom > 0) {
        for (const c of byCategory) {
          donutSegments.push({
            key: c.category,
            amount: c.amount,
            percentage: (c.amount / denom) * 100,
          });
        }
        if (!overBudget) {
          const rem = budget - spent;
          donutSegments.push({
            key: 'remaining',
            amount: rem,
            percentage: (rem / denom) * 100,
          });
        }
      }
    }

    return {
      loading,
      spent,
      remaining,
      percentage,
      status: getBudgetStatus(percentage),
      dailyAverage,
      byCategory,
      donutSegments,
      byDay,
    };
  }, [loading, spent, byCategory, byDay, budget, tripStart, tripEnd]);
}
