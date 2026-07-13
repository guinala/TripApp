import { useEffect, useMemo, useState } from 'react';
import { getRateOn } from '@/services/exchangeRates';

type LiveConversion = {
  converted: number | null;
  rateDate: string | null;
  loading: boolean;
};

type ConversionResult = {
  key: string;
  converted: number;
  rateDate: string | null;
};

// Sin setState síncrono en el efecto (react-hooks/set-state-in-effect):
// el efecto solo guarda el resultado con la clave de su petición y
// `loading` se deriva en el render comparando claves.
const IDLE: LiveConversion = { converted: null, rateDate: null, loading: false };

export function useLiveConversion(
  amount: number,
  fromCurrency: string,
  targetCurrency: string,
  date: string, // YYYY-MM-DD
  debounceMs = 400,
): LiveConversion {
  const [result, setResult] = useState<ConversionResult | null>(null);

  const idle = fromCurrency === targetCurrency || !amount || amount <= 0;
  const key = idle ? null : `${amount}|${fromCurrency}|${targetCurrency}|${date}`;

  useEffect(() => {
    if (key == null) return;

    let cancelled = false;
    const t = setTimeout(async () => {
      const { rate, rateDate } = await getRateOn(fromCurrency, targetCurrency, date);
      if (cancelled) return;
      setResult({ key, converted: amount * rate, rateDate });
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [key, amount, fromCurrency, targetCurrency, date, debounceMs]);

  return useMemo(() => {
    if (key == null) return IDLE;
    if (result == null || result.key !== key) {
      return { converted: null, rateDate: null, loading: true };
    }
    return { converted: result.converted, rateDate: result.rateDate, loading: false };
  }, [key, result]);
}
