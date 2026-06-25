import type { Expense } from '@/types/expense';
import { convert } from '@/utils/currency';

export async function calculateTotalInCurrency(
  expenses: Expense[],
  targetCurrency: string,
): Promise<number> {
  // 1. Importes por moneda de origen
  const sumsByCurrency = new Map<string, number>();
  for (const e of expenses) {
    sumsByCurrency.set(e.currency, (sumsByCurrency.get(e.currency) ?? 0) + e.amount);
  }

  // 2. Conversión por moneda distinta, en paralelo
  const entries = [...sumsByCurrency.entries()];
  const converted = await Promise.all(
    entries.map(([currency, sum]) =>
      currency === targetCurrency ? Promise.resolve(sum) : convert(sum, currency, targetCurrency),
    ),
  );

  return converted.reduce((total, value) => total + value, 0);
}
