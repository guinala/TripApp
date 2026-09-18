import { useCallback, useEffect, useState } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Expense, ExpenseCategory } from "@/types/expense";
import { useExpenseStore } from "@/store/expenseStore";
import { getRateOn } from "@/services/exchangeRates";

export type BudgetStatus = "safe" | "caution" | "warning" | "over";

export type DonutSegmentKey = ExpenseCategory | "remaining";

export type DonutSegment = {
  key: DonutSegmentKey;
  amount: number;
  percentage: number;
};

export type CategoryBreakdown = { category: ExpenseCategory; amount: number };

export type DayBreakdown = { date: string; amount: number };

export interface BudgetSummary {
  loading: boolean;
  error: boolean;
  retry: () => void;
  spent: number | null;
  remaining: number | null;
  percentage: number | null;
  status: BudgetStatus;
  dailyAverage: number | null;
  byCategory: CategoryBreakdown[];
  donutSegments: DonutSegment[];
  byDay: DayBreakdown[];
}

export function getBudgetStatus(value: number | null): BudgetStatus {
  return value === null
    ? "safe"
    : value > 100
    ? "over"
    : value > 80
    ? "warning"
    : value > 60
    ? "caution"
    : "safe";
}

const EMPTY: Expense[] = [];

type Result = {
  expenses: Expense[];
  key: string;
  spent: number | null;
  byCategory: CategoryBreakdown[];
  byDay: DayBreakdown[];
  error: boolean;
};

export function useBudgetSummary(
  tripId: string,
  budget: number,
  currency: string,
  start?: string,
  end?: string,
): BudgetSummary {
  const expenses = useExpenseStore((s) => s.byTrip[tripId] ?? EMPTY);
  const loaded = useExpenseStore((s) => s.byTrip[tripId] !== undefined);
  const sourceLoading = useExpenseStore((s) =>
    s.loadingByTrip[tripId] ?? false
  );
  const sourceError = useExpenseStore((s) => s.errorByTrip[tripId]);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const key = JSON.stringify([tripId, currency, attempt]);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        let spent = 0;
        const categories = new Map<ExpenseCategory, number>();
        const dates = new Map<string, number>();
        for (const expense of expenses) {
          const { rate } = await getRateOn(
            expense.currency,
            currency,
            expense.date,
          );
          if (cancelled) return;
          const amount = expense.amount * rate;
          spent += amount;
          categories.set(
            expense.category,
            (categories.get(expense.category) ?? 0) + amount,
          );
          dates.set(expense.date, (dates.get(expense.date) ?? 0) + amount);
        }
        if (!cancelled) {
          setResult({
            expenses,
            key,
            spent,
            error: false,
            byCategory: [...categories]
              .map(([category, amount]) => ({ category, amount }))
              .sort((a, b) => b.amount - a.amount),
            byDay: [...dates]
              .map(([date, amount]) => ({ date, amount }))
              .sort((a, b) => a.date.localeCompare(b.date)),
          });
        }
      } catch {
        if (!cancelled) {
          setResult({
            expenses,
            key,
            spent: null,
            error: true,
            byCategory: [],
            byDay: [],
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [expenses, currency, key]);

  const current = result?.key === key && result.expenses === expenses
    ? result
    : null;
  const loading = sourceLoading || (!loaded && !sourceError) || !current;
  const error = !!sourceError || !!current?.error;
  const valid = loaded && !loading && !error;
  const spent = valid ? current!.spent : null;
  const byCategory = valid ? current!.byCategory : [];
  const byDay = valid ? current!.byDay : [];
  const percentage = spent !== null && budget > 0
    ? (spent / budget) * 100
    : null;
  const elapsed = start
    ? Math.max(
      1,
      differenceInCalendarDays(
        end && parseISO(end) < new Date() ? parseISO(end) : new Date(),
        parseISO(start),
      ) + 1,
    )
    : Math.max(1, byDay.length);

  const denom = spent !== null ? Math.max(spent, budget) : 0;
  const donutSegments: DonutSegment[] = denom > 0
    ? byCategory.map((item) => ({
      key: item.category,
      amount: item.amount,
      percentage: (item.amount / denom) * 100,
    }))
    : [];

  if (spent !== null && budget > spent) {
    donutSegments.push({
      key: "remaining",
      amount: budget - spent,
      percentage: ((budget - spent) / budget) * 100,
    });
  }

  return {
    loading,
    error,
    retry,
    spent,
    remaining: spent !== null ? budget - spent : null,
    percentage,
    status: getBudgetStatus(percentage),
    dailyAverage: spent !== null ? spent / elapsed : null,
    byCategory,
    byDay,
    donutSegments,
  };
}
