import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/services/supabase";
import {
  accountVersion,
  assertAccount,
  subscribeAccount,
} from "@/services/account-session";

const cache = new Map<string, { url: string; expires: number }>();

subscribeAccount(() => cache.clear());

const EMPTY = new Map<string, string>();

export function useSignedUrls(paths: string[]) {
  const version = useSyncExternalStore(
    subscribeAccount,
    accountVersion,
    accountVersion,
  );
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    cache.clear();
    setAttempt((n) => n + 1);
  }, []);
  const pathsKey = JSON.stringify(paths);
  const key = JSON.stringify([pathsKey, version, attempt]);
  const [result, setResult] = useState<
    {
      key: string;
      urls: Map<string, string>;
      error: boolean;
    } | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    const wanted = JSON.parse(pathsKey) as string[];

    void (async () => {
      const urls = new Map<string, string>();
      try {
        assertAccount(version);
        const missing = wanted.filter(
          (path) => !cache.has(path) || cache.get(path)!.expires <= Date.now(),
        );
        // Acotar el tamaño de cada solicitud a Storage.
        for (let i = 0; i < missing.length; i += 100) {
          const batch = missing.slice(i, i + 100);
          const { data, error } = await supabase.storage
            .from("trip-photos")
            .createSignedUrls(batch, 3600);
          assertAccount(version);
          if (error) throw error;
          data?.forEach((item, index) => {
            if (item.signedUrl && !item.error) {
              cache.set(batch[index], {
                url: item.signedUrl,
                expires: Date.now() + 3_300_000,
              });
            }
          });
        }
        for (const path of wanted) {
          const entry = cache.get(path);
          if (entry && entry.expires > Date.now()) urls.set(path, entry.url);
        }
        if (!cancelled) {
          setResult({ key, urls, error: urls.size !== new Set(wanted).size });
        }
      } catch {
        if (!cancelled && version === accountVersion()) {
          setResult({ key, urls: EMPTY, error: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathsKey, key, version]);

  const current = result?.key === key ? result : null;

  return {
    urls: current?.urls ?? EMPTY,
    loading: !current && paths.length > 0,
    error: current?.error ?? false,
    retry,
  };
}
