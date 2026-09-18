import { useCallback, useEffect, useState } from "react";
import { getRateOn } from "@/services/exchangeRates";

export function useLiveConversion(
  amount: number,
  from: string,
  to: string,
  date: string,
  debounceMs = 400,
) {
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const key = JSON.stringify([amount, from, to, date, attempt]);
  const enabled = Number.isFinite(amount) && amount > 0 && from !== to;
  const [result, setResult] = useState<
    {
      key: string;
      converted: number | null;
      rateDate: string | null;
      error: boolean;
    } | null
  >(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void getRateOn(from, to, date).then(
        ({ rate, rateDate }) => {
          if (!cancelled) {
            setResult({
              key,
              converted: amount * rate,
              rateDate,
              error: false,
            });
          }
        },
        () => {
          if (!cancelled) {
            setResult({ key, converted: null, rateDate: null, error: true });
          }
        },
      );
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, key, from, to, date, amount, debounceMs]);

  const current = enabled && result?.key === key ? result : null;

  return {
    converted: current?.converted ?? null,
    rateDate: current?.rateDate ?? null,
    error: current?.error ?? false,
    loading: enabled && !current,
    retry,
  };
}
