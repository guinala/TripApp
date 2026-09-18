import { create } from "zustand";
import type { Trip } from "@/types/trip";
import {
  createTrip,
  type CreateTripInput,
  deleteTrip,
  listTrips,
  updateTrip,
} from "@/services/trips";
import { useAuthStore } from "@/store/authStore";

type State = {
  trips: Trip[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  upsertTrip: (trip: Trip) => void;
  fetchTrips: () => Promise<void>;
  addTrip: (input: CreateTripInput) => Promise<Trip>;
  editTrip: (id: string, patch: Partial<CreateTripInput>) => Promise<void>;
  removeTrip: (id: string) => Promise<void>;
};
let generation = 0,
  listing = 0;
const owner = () => useAuthStore.getState().user?.id;
export const useTripStore = create<State>((set, get) => ({
  loaded: false,
  trips: [],
  loading: false,
  error: null,
  upsertTrip: (trip) => {
    if (trip.userId === owner()) {
      set((s) => ({
        trips: s.trips.some((t) => t.id === trip.id)
          ? s.trips.map((t) => (t.id === trip.id ? trip : t))
          : [trip, ...s.trips],
      }));
    }
  },
  fetchTrips: async () => {
    const id = owner(),
      started = generation,
      request = ++listing;
    if (!id) return;
    set({ loading: true, error: null });
    try {
      const trips = await listTrips(id);
      if (started === generation && request === listing) {
        set({ trips, loading: false, loaded: true });
      }
    } catch (e) {
      if (started === generation && request === listing) {
        set({ loading: false, error: e instanceof Error ? e.message : "load" });
      }
    }
  },
  addTrip: async (input) => {
    const id = owner(),
      started = generation;
    if (!id) throw new Error("No hay sesión activa");
    const trip = await createTrip(id, input);
    if (started !== generation) throw new Error("La sesión ha cambiado");
    get().upsertTrip(trip);
    return trip;
  },
  editTrip: async (id, patch) => {
    const started = generation;
    const trip = await updateTrip(id, patch);
    if (started !== generation) throw new Error("La sesión ha cambiado");
    get().upsertTrip(trip);
  },
  removeTrip: async (id) => {
    const started = generation;
    await deleteTrip(id);
    if (started === generation) {
      set((s) => ({ trips: s.trips.filter((t) => t.id !== id) }));
    }
  },
}));

useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id) {
    generation++;
    listing++;
    useTripStore.setState({
      trips: [],
      loading: false,
      loaded: false,
      error: null,
    });
  }
});
