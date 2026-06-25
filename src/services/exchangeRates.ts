type CacheEntry = {
  rate: number;
  timestamp: number;
};

const cache = new Map<string, CacheEntry>();
const TTL_MS = 60 * 60 * 1000; // 1 hora

export async function getRate(from: string, to: string): Promise<number> {
  // Misma moneda: nada que convertir
  if (from === to) return 1;

  const key = `${from}->${to}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < TTL_MS) {
    return cached.rate;
  }

  try {
    const url = `https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const rate = json?.rates?.[to];

    if (typeof rate !== 'number') {
      throw new Error(`Sin tipo de cambio para ${from}->${to}`);
    }

    cache.set(key, { rate, timestamp: Date.now() });
    return rate;
  } catch (err) {
    console.warn(`[exchangeRates] Falló getRate(${from}, ${to}):`, err);
    return 1; // fallback: se muestra el importe sin convertir
  }
}
