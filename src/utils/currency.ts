import { getRate } from '@/services/exchangeRates';

export async function convert(amount: number, from: string, to: string): Promise<number> {
  if (from === to) return amount;
  const rate = await getRate(from, to);
  return amount * rate;
}

export function formatCurrency(amount: number, currency: string, locale = 'es-ES'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    // Formato plano
    return `${amount.toFixed(2)} ${currency}`;
  }
}
