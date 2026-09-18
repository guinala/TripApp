import {
  accountVersion,
  assertAccount,
  isCurrentAccount,
  subscribeAccount,
} from "@/services/account-session";
import { create } from "zustand";
import type { PackingCategory, PackingItem } from "@/types/packing";
import {
  bulkInsert,
  clearItems,
  createItem,
  deleteItem,
  listItems,
  type PackingSeed,
  replacePackingItems,
  toggleItem,
  updateItem,
} from "@/services/packing";

const EMPTY: PackingItem[] = [];

type NewItem = { name: string; category: PackingCategory };

type PackingState = {
  byTrip: Record<string, PackingItem[]>;
  loadingByTrip: Record<string, boolean>;
  error: string | null;
  errorByTrip: Record<string, string | null>;

  fetchItems: (tripId: string) => Promise<void>;
  addItem: (tripId: string, item: NewItem) => Promise<void>;
  toggle: (tripId: string, id: string, checked: boolean) => Promise<void>;
  editItem: (
    tripId: string,
    id: string,
    patch: Partial<NewItem>,
  ) => Promise<void>;
  removeItem: (tripId: string, id: string) => Promise<void>;

  addItems: (tripId: string, seeds: PackingSeed[]) => Promise<void>;
  replaceItems: (tripId: string, seeds: PackingSeed[]) => Promise<void>;
  duplicateFrom: (targetTripId: string, sourceTripId: string) => Promise<void>;
  clear: (tripId: string) => Promise<void>;
};

export const usePackingStore = create<PackingState>((set, get) => ({
  errorByTrip: {},
  byTrip: {},
  loadingByTrip: {},
  error: null,

  fetchItems: async (tripId) => {
    const started = accountVersion();
    if (!isCurrentAccount(started)) return;

    set((s) => ({
      loadingByTrip: { ...s.loadingByTrip, [tripId]: true },
      errorByTrip: { ...s.errorByTrip, [tripId]: null },
      error: null,
    }));
    try {
      const items = await listItems(tripId);
      if (!isCurrentAccount(started)) return;
      set((s) => ({
        byTrip: { ...s.byTrip, [tripId]: items },
        loadingByTrip: { ...s.loadingByTrip, [tripId]: false },
      }));
    } catch (e) {
      if (!isCurrentAccount(started)) return;

      set((s) => ({
        error: (e as Error).message,
        errorByTrip: { ...s.errorByTrip, [tripId]: "load" },
        loadingByTrip: { ...s.loadingByTrip, [tripId]: false },
      }));
    }
  },

  addItem: async (tripId, item) => {
    const started = accountVersion();
    assertAccount(started);

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
      byTrip: {
        ...s.byTrip,
        [tripId]: [...(s.byTrip[tripId] ?? []), optimistic],
      },
    }));

    try {
      const created = await createItem({
        tripId,
        name: item.name,
        category: item.category,
      });
      assertAccount(started);
      set((s) => ({
        byTrip: {
          ...s.byTrip,
          [tripId]: (s.byTrip[tripId] ?? []).map((
            i,
          ) => (i.id === tempId ? created : i)),
        },
      }));
    } catch (e) {
      assertAccount(started);

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
    const started = accountVersion();
    assertAccount(started);

    const previous = get().byTrip[tripId] ?? [];
    set((s) => ({
      byTrip: {
        ...s.byTrip,
        [tripId]: previous.map((i) => (i.id === id ? { ...i, checked } : i)),
      },
    }));
    try {
      await toggleItem(id, checked);
      assertAccount(started);
    } catch (e) {
      assertAccount(started);

      set((s) => ({ byTrip: { ...s.byTrip, [tripId]: previous } }));
      throw e;
    }
  },

  editItem: async (tripId, id, patch) => {
    const started = accountVersion();
    assertAccount(started);

    const previous = get().byTrip[tripId] ?? [];
    set((s) => ({
      byTrip: {
        ...s.byTrip,
        [tripId]: previous.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      },
    }));
    try {
      await updateItem(id, patch);
      assertAccount(started);
    } catch (e) {
      assertAccount(started);

      set((s) => ({ byTrip: { ...s.byTrip, [tripId]: previous } }));
      throw e;
    }
  },

  removeItem: async (tripId, id) => {
    const started = accountVersion();
    assertAccount(started);

    const previous = get().byTrip[tripId] ?? [];
    set((s) => ({
      byTrip: { ...s.byTrip, [tripId]: previous.filter((i) => i.id !== id) },
    }));
    try {
      await deleteItem(id);
      assertAccount(started);
    } catch (e) {
      assertAccount(started);

      set((s) => ({ byTrip: { ...s.byTrip, [tripId]: previous } }));
      throw e;
    }
  },

  addItems: async (tripId, seeds) => {
    const started = accountVersion();
    assertAccount(started);

    const inserted = await bulkInsert(tripId, seeds);
    assertAccount(started);
    set((s) => ({
      byTrip: {
        ...s.byTrip,
        [tripId]: [...(s.byTrip[tripId] ?? []), ...inserted],
      },
    }));
  },

  replaceItems: async (tripId, seeds) => {
    const started = accountVersion();
    assertAccount(started);

    const previous = get().byTrip[tripId] ?? [];
    try {
      const inserted = await replacePackingItems(tripId, seeds);
      assertAccount(started);
      set((s) => ({ byTrip: { ...s.byTrip, [tripId]: inserted } }));
    } catch (e) {
      assertAccount(started);

      set((s) => ({ byTrip: { ...s.byTrip, [tripId]: previous } }));
      throw e;
    }
  },

  duplicateFrom: async (targetTripId, sourceTripId) => {
    const started = accountVersion();
    assertAccount(started);

    const source = get().byTrip[sourceTripId] ??
      (await listItems(sourceTripId));
    assertAccount(started);
    const seeds: PackingSeed[] = source.map((i) => ({
      name: i.name,
      category: i.category,
      checked: false,
    }));
    const inserted = await bulkInsert(targetTripId, seeds);
    assertAccount(started);
    set((s) => ({
      byTrip: {
        ...s.byTrip,
        [targetTripId]: [...(s.byTrip[targetTripId] ?? []), ...inserted],
      },
    }));
  },

  clear: async (tripId) => {
    const started = accountVersion();
    assertAccount(started);

    const previous = get().byTrip[tripId] ?? [];
    set((s) => ({ byTrip: { ...s.byTrip, [tripId]: [] } }));
    try {
      await clearItems(tripId);
      assertAccount(started);
    } catch (e) {
      assertAccount(started);

      set((s) => ({ byTrip: { ...s.byTrip, [tripId]: previous } }));
      throw e;
    }
  },
}));

export const usePackingItems = (tripId: string): PackingItem[] =>
  usePackingStore((s) => s.byTrip[tripId] ?? EMPTY);

export const usePackingLoading = (tripId: string): boolean =>
  usePackingStore((s) => s.loadingByTrip[tripId] ?? false);

subscribeAccount(() =>
  usePackingStore.setState({
    byTrip: {},
    loadingByTrip: {},
    error: null,
    errorByTrip: {},
  })
);
