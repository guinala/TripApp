import { accountVersion, assertAccount } from '@/services/account-session';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type ActivityInput,
  createActivity,
  deleteActivity,
  listActivitiesByTrip,
  reorderActivities,
  updateActivity as saveActivity,
} from '@/services/activities';
import { ensureDays } from '@/services/days';
import type { Activity } from '@/types/activity';
import type { Day } from '@/types/day';
import type { Trip } from '@/types/trip';
import { usePlaceDetails, usePlaceLanguage } from '@/hooks/use-place-details';
import { useMapActivities } from '@/hooks/use-map-activities';
import { useItineraryRefreshStore } from '@/store/itineraryRefreshStore';
import { placeSessionVersion } from '@/services/place-session';

function useTripDetailValue(trip: Trip) {
  const [result, setResult] = useState<{
    key: string;
    days: Day[];
    activities: Activity[];
    error: string | null;
  } | null>(null);

  const [attempt, setAttempt] = useState(0);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const revision = useItineraryRefreshStore((s) => s.revisions[trip.id] ?? 0);
  const key = JSON.stringify([trip, revision, attempt]);
  const current = result?.key === key ? result : null;
  const days = useMemo(() => current?.days ?? [], [current]);
  const activities = useMemo(() => current?.activities ?? [], [current]);
  const loading = !current;
  const error = current?.error ?? null;
  const language = usePlaceLanguage();
  const destinationResolution = usePlaceDetails(trip.destinationPlaceId, language);
  const scoped = useMemo(
    () => activities.filter((a) => selectedDayId === null || a.dayId === selectedDayId),
    [activities, selectedDayId],
  );
  const locations = useMapActivities(scoped, language);

  const reload = useCallback(async () => {
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const loadedDays = await ensureDays(trip);
        const loadedActivities = await listActivitiesByTrip(trip.id);
        if (cancelled) return;
        setResult({ key, days: loadedDays, activities: loadedActivities, error: null });
        setSelectedDayId((id) => (loadedDays.some((day) => day.id === id) ? id : null));
      } catch (e) {
        if (!cancelled)
          setResult({
            key,
            days: [],
            activities: [],
            error: e instanceof Error ? e.message : 'load',
          });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trip, key]);

  const addActivity = async (input: Omit<ActivityInput, 'orderIndex'>) => {
    const epoch = placeSessionVersion();
    const orderIndex =
      Math.max(-1, ...activities.filter((a) => a.dayId === input.dayId).map((a) => a.orderIndex)) +
      1;
    const created = await createActivity({ ...input, orderIndex });
    if (epoch === placeSessionVersion())
      setResult((previous) =>
        previous?.key === key
          ? { ...previous, activities: [...previous.activities, created] }
          : previous,
      );
  };

  const updateActivity = async (id: string, input: Omit<ActivityInput, 'orderIndex'>) => {
    const epoch = placeSessionVersion();
    const updated = await saveActivity(id, input);
    if (epoch === placeSessionVersion())
      setResult((previous) =>
        previous?.key === key
          ? { ...previous, activities: previous.activities.map((a) => (a.id === id ? updated : a)) }
          : previous,
      );
  };

  const removeActivity = async (id: string) => {
    const started = accountVersion();
    const activity = activities.find((item) => item.id === id);
    if (!activity) throw new Error('ACTIVITY_NOT_FOUND');

    await deleteActivity(id);

    assertAccount(started);
    setResult((previous) =>
      previous?.key === key
        ? { ...previous, activities: previous.activities.filter((item) => item.id !== id) }
        : previous,
    );
  };

  const reorder = async (dayId: string, orderedIds: string[]) => {
    const own = activities.filter((a) => a.dayId === dayId);

    if (
      new Set(orderedIds).size !== own.length ||
      orderedIds.length !== own.length ||
      orderedIds.some((id) => !own.some((a) => a.id === id))
    )
      throw new Error('Orden inválido');
    await reorderActivities(orderedIds);
    await reload();
  };

  return {
    trip,
    days,
    activities,
    loading,
    error,
    reload,
    selectedDayId,
    setSelectedDayId,
    addActivity,
    updateActivity,
    removeActivity,
    reorder,
    destinationResolution,
    retryDestination: destinationResolution.retry,
    mapActivities: locations.mapActivities,
    missingLocations: locations.missingLocations,
    locationsLoading: locations.loading,
    locationFailures: locations.failures,
    retryActivityLocations: locations.retry,
    mapAttributions: [
      ...(destinationResolution.place?.attributions ?? []),
      ...locations.attributions,
    ],
  };
}

const TripDetailContext = createContext<ReturnType<typeof useTripDetailValue> | null>(null);

export function TripDetailProvider({ trip, children }: { trip: Trip; children: React.ReactNode }) {
  const value = useTripDetailValue(trip);

  return <TripDetailContext.Provider value={value}>{children}</TripDetailContext.Provider>;
}

export function useTripDetail() {
  const context = useContext(TripDetailContext);
  if (!context) throw new Error('useTripDetail requiere TripDetailProvider');

  return context;
}
