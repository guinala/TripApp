import { create } from 'zustand';
import type { PackingItem, PackingCategory } from '@/types/packing';
import {
  listItems,
  createItem,
  toggleItem,
  updateItem,
  deleteItem,
  bulkInsert,
  clearItems,
  type PackingSeed,
} from '@/services/packing';

const EMPTY: PackingItem[] = [];

type NewItem = { name: string; category: PackingCategory };

type PackingState = {
  byTrip: Record<string, PackingItem[]>;
  loadingByTrip: Record<string, boolean>;
  error: string | null;

  fetchItems: (tripId: string) => Promise<void>;
  addItem: (tripId: string, item: NewItem) => Promise<void>;
  toggle: (tripId: string, id: string, checked: boolean) => Promise<void>;
  editItem: (tripId: string, id: string, patch: Partial<NewItem>) => Promise<void>;
  removeItem: (tripId: string, id: string) => Promise<void>;

  // Operaciones masivas (plantillas / duplicación)
  addItems: (tripId: string, seeds: PackingSeed[]) => Promise<void>;
  replaceItems: (tripId: string, seeds: PackingSeed[]) => Promise<void>;
  duplicateFrom: (targetTripId: string, sourceTripId: string) => Promise<void>;
  clear: (tripId: string) => Promise<void>;
};

export const usePackingStore = create<PackingState>((set, get) => ({
  byTrip: {},
  loadingByTrip: {},
  error: null,

  fetchItems: async (tripId) => {
    set((s) => ({ loadingByTrip: { ...s.loadingByTrip, [tripId]: true }, error: null }));
    try {
      const items = await listItems(tripId);
      set((s) => ({
        byTrip: { ...s.byTrip, [tripId]: items },
        loadingByTrip: { ...s.loadingByTrip, [tripId]: false },
      }));
    } catch (e) {
      set((s) => ({
        error: (e as Error).message,
        loadingByTrip: { ...s.loadingByTrip, [tripId]: false },
      }));
    }
  },

  addItem: async (tripId, item) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic: PackingItem = {
      id: tempId,
      tripId,
      name: item.name,
      category: item.category,
      checked: false,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      byTrip: { ...s.byTrip, [tripId]: [...(s.byTrip[tripId] ?? []), optimistic] },
    }));

    try {
      const created = await createItem({ tripId, name: item.name, category: item.category });
      set((s) => ({
        byTrip: {
          ...s.byTrip,
          [tripId]: (s.byTrip[tripId] ?? []).map((i) => (i.id === tempId ? created : i)),
        },
      }));
    } catch (e) {
      set((s) => ({
        byTrip: {
          ...s.byTrip,
          [tripId]: (s.byTrip[tripId] ?? []).filter((i) => i.id !== tempId),
        },
      }));
      throw e;
    }
  },

  toggle: async (tripId, id, checked) => {
    const previous = get().byTrip[tripId] ?? [];
    set((s) => ({
      byTrip: {
        ...s.byTrip,
        [tripId]: previous.map((i) => (i.id === id ? { ...i, checked } : i)),
      },
    }));
    try {
      await toggleItem(id, checked);
    } catch (e) {
      set((s) => ({ byTrip: { ...s.byTrip, [tripId]: previous } }));
      throw e;
    }
  },

  editItem: async (tripId, id, patch) => {
    const previous = get().byTrip[tripId] ?? [];
    set((s) => ({
      byTrip: {
        ...s.byTrip,
        [tripId]: previous.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      },
    }));
    try {
      await updateItem(id, patch);
    } catch (e) {
      set((s) => ({ byTrip: { ...s.byTrip, [tripId]: previous } }));
      throw e;
    }
  },

  removeItem: async (tripId, id) => {
    const previous = get().byTrip[tripId] ?? [];
    set((s) => ({
      byTrip: { ...s.byTrip, [tripId]: previous.filter((i) => i.id !== id) },
    }));
    try {
      await deleteItem(id);
    } catch (e) {
      set((s) => ({ byTrip: { ...s.byTrip, [tripId]: previous } }));
      throw e;
    }
  },

  addItems: async (tripId, seeds) => {
    const inserted = await bulkInsert(tripId, seeds);
    set((s) => ({
      byTrip: { ...s.byTrip, [tripId]: [...(s.byTrip[tripId] ?? []), ...inserted] },
    }));
  },

  replaceItems: async (tripId, seeds) => {
    await clearItems(tripId);
    const inserted = await bulkInsert(tripId, seeds);
    set((s) => ({ byTrip: { ...s.byTrip, [tripId]: inserted } }));
  },

  duplicateFrom: async (targetTripId, sourceTripId) => {
    const source = get().byTrip[sourceTripId] ?? (await listItems(sourceTripId));
    const seeds: PackingSeed[] = source.map((i) => ({
      name: i.name,
      category: i.category,
      checked: false,
    }));
    const inserted = await bulkInsert(targetTripId, seeds);
    set((s) => ({
      byTrip: {
        ...s.byTrip,
        [targetTripId]: [...(s.byTrip[targetTripId] ?? []), ...inserted],
      },
    }));
  },

  clear: async (tripId) => {
    const previous = get().byTrip[tripId] ?? [];
    set((s) => ({ byTrip: { ...s.byTrip, [tripId]: [] } }));
    try {
      await clearItems(tripId);
    } catch (e) {
      set((s) => ({ byTrip: { ...s.byTrip, [tripId]: previous } }));
      throw e;
    }
  },
}));

export const usePackingItems = (tripId: string): PackingItem[] =>
  usePackingStore((s) => s.byTrip[tripId] ?? EMPTY);

export const usePackingLoading = (tripId: string): boolean =>
  usePackingStore((s) => s.loadingByTrip[tripId] ?? false);
