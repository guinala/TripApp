import { create } from 'zustand';
import type { Trip } from '@/types/trip';
import {
  listTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  type CreateTripInput,
} from '@/services/trips';
import { useAuthStore } from '@/store/authStore';

type TripState = {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  fetchTrips: () => Promise<void>;
  addTrip: (input: CreateTripInput) => Promise<Trip>;
  editTrip: (id: string, patch: Partial<CreateTripInput>) => Promise<void>;
  removeTrip: (id: string) => Promise<void>;
};

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  loading: false,
  error: null,

  fetchTrips: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    set({ loading: true, error: null });
    try {
      const trips = await listTrips(userId);
      set({ trips, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  addTrip: async (input) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('No hay sesión activa');

    const trip = await createTrip(userId, input);
    // Lo nuevo va al principio (desc)
    set({ trips: [trip, ...get().trips] });
    return trip;
  },

  editTrip: async (id, patch) => {
    const updated = await updateTrip(id, patch);
    set({ trips: get().trips.map((t) => (t.id === id ? updated : t)) });
  },

  removeTrip: async (id) => {
    const previous = get().trips;

    set({ trips: previous.filter((t) => t.id !== id) });
    try {
      await deleteTrip(id);
    } catch (e) {
      set({ trips: previous });
      throw e;
    }
  },
}));
