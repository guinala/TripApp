import { useEffect, useState } from 'react';
import { getRateOn } from '@/services/exchangeRates';

type LiveConversion = {
  converted: number | null;
  rateDate: string | null;
  loading: boolean;
};

export function useLiveConversion(
  amount: number,
  fromCurrency: string,
  targetCurrency: string,
  date: string, // YYYY-MM-DD
  debounceMs = 400,
): LiveConversion {
  const [state, setState] = useState<LiveConversion>({
    converted: null,
    rateDate: null,
    loading: false,
  });

  useEffect(() => {
    if (fromCurrency === targetCurrency || !amount || amount <= 0) {
      setState({ converted: null, rateDate: null, loading: false });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));

    const t = setTimeout(async () => {
      const { rate, rateDate } = await getRateOn(fromCurrency, targetCurrency, date);
      if (cancelled) return;
      setState({ converted: amount * rate, rateDate, loading: false });
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [amount, fromCurrency, targetCurrency, date, debounceMs]);

  return state;
}
