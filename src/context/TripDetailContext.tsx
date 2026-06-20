import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityInput,
  createActivity,
  listActivitiesByTrip,
  reorderActivities,
} from '@/services/activities';
import { ensureDays } from '@/services/days';
import type { Activity } from '@/types/activity';
import type { Day } from '@/types/day';
import type { Trip } from '@/types/trip';
import { reload } from 'expo-router/build/global-state/router';

type TripDetailValue = {
  trip: Trip;
  days: Day[];
  activities: Activity[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  selectedDayId: string | null; // null = "Todo"
  addActivity: (input: Omit<ActivityInput, 'orderIndex'>) => Promise<void>;
  setSelectedDayId: (id: string | null) => void;
  reorder: (dayId: string, orderedIds: string[]) => Promise<void>;
};

const TripDetailContext = createContext<TripDetailValue | null>(null);

export function TripDetailProvider({ trip, children }: { trip: Trip; children: React.ReactNode }) {
  const [days, setDays] = useState<Day[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  const addActivity = useCallback(
    async (input: Omit<ActivityInput, 'orderIndex'>) => {
      const dayActivities = activities.filter((a) => a.dayId === input.dayId);
      const created = await createActivity({ ...input, orderIndex: dayActivities.length });
      setActivities((prev) => [...prev, created]);
    },
    [activities],
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [loadedDays, loadedActivities] = await Promise.all([
        ensureDays(trip),
        listActivitiesByTrip(trip.id),
      ]);
      setDays(loadedDays);
      setActivities(loadedActivities);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el itinerario');
    } finally {
      setLoading(false);
    }
  }, [trip]);

  const reorder = useCallback(async (dayId: string, orderedIds: string[]) => {
    setActivities((prev) => {
      const byId = new Map(prev.map((a) => [a.id, a]));
      const reordered = orderedIds.map((id, i) => ({ ...byId.get(id)!, orderIndex: i }));
      return [...prev.filter((a) => a.dayId !== dayId), ...reordered];
    });
    try {
      await reorderActivities(orderedIds);
    } catch {
      reload(); // volver al estado real
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <TripDetailContext.Provider
      value={{
        trip,
        days,
        activities,
        loading,
        error,
        reload: load,
        selectedDayId,
        setSelectedDayId,
        addActivity,
      }}
    >
      {children}
    </TripDetailContext.Provider>
  );
}

export function useTripDetail(): TripDetailValue {
  const ctx = useContext(TripDetailContext);
  if (!ctx) throw new Error('useTripDetail debe usarse dentro de <TripDetailProvider>');
  return ctx;
}
