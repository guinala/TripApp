import { format, isValid, parseISO } from "date-fns";

export type HistoricalRate = { rate: number; rateDate: string };

const cache = new Map<string, { value: HistoricalRate; expires: number }>();

const pending = new Map<string, Promise<HistoricalRate>>();

export function clearExchangeRates() {
  cache.clear();
}

export async function getRateOn(
  from: string,
  to: string,
  date: string,
): Promise<HistoricalRate> {
  if (
    !/^[A-Z]{3}$/.test(from) ||
    !/^[A-Z]{3}$/.test(to) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !isValid(parseISO(date)) ||
    format(parseISO(date), "yyyy-MM-dd") !== date
  ) {
    throw new Error("INVALID_RATE_INPUT");
  }
  if (from === to) return { rate: 1, rateDate: date };

  if (date > format(new Date(), "yyyy-MM-dd")) {
    throw new Error("FUTURE_RATE_UNAVAILABLE");
  }

  const key = `${from}:${to}:${date}`;

  const hit = cache.get(key);

  if (hit && hit.expires > Date.now()) return hit.value;

  const running = pending.get(key);

  if (running) return running;

  const request = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const url =
        `https://api.frankfurter.dev/v1/${date}?base=${from}&symbols=${to}`;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error("RATE_UNAVAILABLE");
      const body = await response.json();
      const rate = body.rates?.[to];
      if (
        body.base !== from ||
        typeof rate !== "number" ||
        !Number.isFinite(rate) ||
        rate <= 0 ||
        typeof body.date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(body.date) ||
        body.date > date
      ) {
        throw new Error("INVALID_RATE_RESPONSE");
      }
      const value = { rate, rateDate: body.date };
      cache.set(key, { value, expires: Date.now() + 3_600_000 });
      if (cache.size > 500) cache.delete(cache.keys().next().value!);
      return value;
    } finally {
      clearTimeout(timer);
    }
  })();

  pending.set(key, request);

  try {
    return await request;
  } finally {
    if (pending.get(key) === request) pending.delete(key);
  }
}

export async function getRate(from: string, to: string): Promise<number> {
  return (await getRateOn(from, to, format(new Date(), "yyyy-MM-dd"))).rate;
}
