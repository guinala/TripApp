import { useCallback, useState, useSyncExternalStore } from "react";
import { useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { getUserStats } from "@/utils/stats";
import type { UserStats } from "@/types/stats";
import type { LatLng } from "@/types/place";
import { usePlaceLanguage } from "./use-place-details";
import {
  placeSessionEnabled,
  placeSessionVersion,
  subscribePlaceSession,
} from "@/services/place-session";

async function resolveOrigin(): Promise<LatLng | null> {
  try {
    if (!(await Location.getForegroundPermissionsAsync()).granted) return null;
    const point = await Location.getLastKnownPositionAsync();
    return point
      ? { lat: point.coords.latitude, lng: point.coords.longitude }
      : null;
  } catch {
    return null;
  }
}

export function useUserStats(userId: string | undefined) {
  const language = usePlaceLanguage();
  const epoch = useSyncExternalStore(
    subscribePlaceSession,
    placeSessionVersion,
    placeSessionVersion,
  );
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([userId, language, epoch, attempt]);
  const [result, setResult] = useState<
    {
      key: string;
      stats: UserStats | null;
      error: string | null;
    } | null
  >(null);

  useFocusEffect(
    useCallback(() => {
      if (!userId || !placeSessionEnabled()) return;
      const controller = new AbortController();
      void (async () => {
        try {
          const origin = await resolveOrigin();
          if (controller.signal.aborted) return;
          const stats = await getUserStats(
            userId,
            origin,
            language,
            controller.signal,
          );
          if (!controller.signal.aborted) {
            setResult({ key, stats, error: null });
          }
        } catch (e) {
          if (!controller.signal.aborted) {
            setResult({
              key,
              stats: null,
              error: e instanceof Error ? e.message : "load",
            });
          }
        }
      })();

      return () => controller.abort();
    }, [key, userId, language]),
  );

  const current = result?.key === key && placeSessionEnabled() ? result : null;

  const reload = useCallback(() => {
    setAttempt((a) => a + 1);
  }, []);

  return {
    stats: current?.stats ?? null,
    loading: !!userId && placeSessionEnabled() && !current,
    error: current?.error ?? null,
    reload,
  };
}
