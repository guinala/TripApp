import type { Expense } from "@/types/expense";
import { getRateOn } from "@/services/exchangeRates";

export async function calculateTotalInCurrency(
  expenses: Expense[],
  targetCurrency: string,
): Promise<number> {
  let total = 0;
  // Para evitar centenares de llamadas simultáneas, el servicio deduplica/cacha por fecha y moneda.
  for (const expense of expenses) {
    const { rate } = await getRateOn(
      expense.currency,
      targetCurrency,
      expense.date,
    );
    total += expense.amount * rate;
  }
  return total;
}
