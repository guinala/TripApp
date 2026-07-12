import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { getUserStats } from '@/utils/stats';
import type { UserStats } from '@/types/stats';
import type { LatLng } from '@/utils/mapRegion';

async function resolveOrigin(): Promise<LatLng | null> {
  try {
    const perm = await Location.getForegroundPermissionsAsync();
    if (!perm.granted) return null;
    const last = await Location.getLastKnownPositionAsync();
    if (last) return { lat: last.coords.latitude, lng: last.coords.longitude };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}

export function useUserStats(userId: string | undefined) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async (): Promise<UserStats | null> => {
    if (!userId) return null;
    const origin = await resolveOrigin();
    return getUserStats(userId, origin);
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await fetchStats().catch(() => null);
      if (!cancelled) {
        setStats(result);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchStats]);

  const reload = useCallback(async () => {
    const result = await fetchStats().catch(() => null);
    setStats(result);
  }, [fetchStats]);

  return { stats, loading, reload };
}
