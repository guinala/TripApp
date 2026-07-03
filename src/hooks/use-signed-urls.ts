import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

type CacheEntry = {
  url: string;
  expiresAt: number;
};

const TTL_MS = 60 * 60 * 1000; // 1 hora
const cache = new Map<string, CacheEntry>();

async function fetchMissing(paths: string[]): Promise<void> {
  if (paths.length === 0) return;

  const { data, error } = await supabase.storage.from('trip-photos').createSignedUrls(paths, 3600);
  if (error) {
    console.warn('[useSignedUrls] createSignedUrls falló:', error.message);
    return;
  }

  const now = Date.now();
  data?.forEach((item, i) => {
    if (item.signedUrl) {
      cache.set(paths[i], { url: item.signedUrl, expiresAt: now + TTL_MS });
    }
  });
}

export function useSignedUrls(paths: string[]): {
  urls: Map<string, string>;
  loading: boolean;
} {
  const [urls, setUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);

  const key = paths.join('|');

  useEffect(() => {
    // if (paths.length === 0) {
    //   setUrls(new Map());
    //   return;
    // }

    let cancelled = false;
    const now = Date.now();

    const missing = paths.filter((p) => {
      const cached = cache.get(p);
      return !cached || cached.expiresAt <= now;
    });

    const applyFromCache = () => {
      const next = new Map<string, string>();
      for (const p of paths) {
        const cached = cache.get(p);
        if (cached) next.set(p, cached.url);
      }
      if (!cancelled) setUrls(next);
    };

    if (missing.length === 0) {
      applyFromCache();
      return;
    }

    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });
    fetchMissing(missing).finally(() => {
      if (cancelled) return;
      applyFromCache();
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [paths, key]);

  return { urls, loading };
}
