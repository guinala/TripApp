import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { isPlacesCancelled, PlacesError } from "@/services/places";
import {
  placeSessionEnabled,
  placeSessionVersion,
  rememberPlace,
  subscribePlaceSession,
} from "@/services/place-session";
import type { PlaceContent } from "@/types/explore";
import type { PlaceLanguage } from "@/types/place";
import { cachedPlaceContent } from "@/services/explore-requests";

export type PlaceContentResolution = {
  status: "unresolved" | "loading" | "ready" | "error";
  content: PlaceContent | null;
  error: PlacesError | null;
  retry: () => void;
};

export function usePlaceContent(
  placeId: string | null,
  language: PlaceLanguage,
  enabled = true,
): PlaceContentResolution {
  const lastAttempt = useRef(0);
  const epoch = useSyncExternalStore(
    subscribePlaceSession,
    placeSessionVersion,
    placeSessionVersion,
  );
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<
    {
      key: string;
      content: PlaceContent | null;
      error: PlacesError | null;
    } | null
  >(null);
  const available = enabled && !!placeId && placeSessionEnabled();
  const key = available
    ? JSON.stringify([placeId, language, epoch, attempt])
    : null;

  useEffect(() => {
    if (!key || !placeId) return;
    const controller = new AbortController();

    const bypassCache = attempt !== lastAttempt.current;
    lastAttempt.current = attempt;

    cachedPlaceContent(placeId, language, {
      signal: controller.signal,
      bypassCache,
    })
      .then((content) => {
        if (controller.signal.aborted) return;
        rememberPlace(content.place, language, epoch);
        setResult({ key, content, error: null });
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted || isPlacesCancelled(caught)) return;
        setResult({
          key,
          content: null,
          error: caught instanceof PlacesError
            ? caught
            : new PlacesError("NETWORK_ERROR", true),
        });
      });
    return () => controller.abort();
  }, [epoch, key, language, placeId, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  if (!available) {
    return { status: "unresolved", content: null, error: null, retry };
  }
  if (result?.key !== key) {
    return { status: "loading", content: null, error: null, retry };
  }
  if (result.error) {
    return { status: "error", content: null, error: result.error, retry };
  }
  return { status: "ready", content: result.content, error: null, retry };
}
