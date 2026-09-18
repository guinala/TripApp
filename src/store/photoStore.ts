import {
  accountVersion,
  assertAccount,
  isCurrentAccount,
  subscribeAccount,
} from "@/services/account-session";
import { create } from "zustand";
import type { Photo } from "@/types/photo";
import {
  createPhoto,
  type CreatePhotoInput,
  deletePhoto,
  listPhotos,
  updatePhoto,
  type UpdatePhotoInput,
} from "@/services/photos";
import i18n from "@/i18n";

type PhotoState = {
  byTrip: Record<string, Photo[]>;
  loadingByTrip: Record<string, boolean>;
  error: string | null;
  errorByTrip: Record<string, string | null>;

  loadPhotos: (tripId: string) => Promise<void>;
  addPhoto: (input: CreatePhotoInput) => Promise<void>;
  editPhoto: (
    tripId: string,
    id: string,
    patch: UpdatePhotoInput,
  ) => Promise<void>;
  removePhoto: (tripId: string, photo: Photo) => Promise<void>;
};

const sortByTakenAtAsc = (list: Photo[]): Photo[] =>
  [...list].sort((a, b) => a.takenAt.localeCompare(b.takenAt));

export const usePhotoStore = create<PhotoState>((set, get) => ({
  errorByTrip: {},
  byTrip: {},
  loadingByTrip: {},
  error: null,

  loadPhotos: async (tripId) => {
    const started = accountVersion();
    if (!isCurrentAccount(started)) return;

    set((s) => ({
      loadingByTrip: { ...s.loadingByTrip, [tripId]: true },
      errorByTrip: { ...s.errorByTrip, [tripId]: null },
      error: null,
    }));
    try {
      const photos = await listPhotos(tripId);
      if (!isCurrentAccount(started)) return;
      set((s) => ({
        byTrip: { ...s.byTrip, [tripId]: photos },
        loadingByTrip: { ...s.loadingByTrip, [tripId]: false },
      }));
    } catch (err) {
      if (!isCurrentAccount(started)) return;

      set((s) => ({
        loadingByTrip: { ...s.loadingByTrip, [tripId]: false },
        error: err instanceof Error
          ? err.message
          : i18n.t("errors.loadTripPhotos"),
        errorByTrip: { ...s.errorByTrip, [tripId]: "load" },
      }));
    }
  },

  addPhoto: async (input) => {
    const started = accountVersion();
    assertAccount(started);

    const { tripId } = input;
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: Photo = {
      id: tempId,
      tripId,
      dayId: input.dayId ?? null,
      uri: input.uri,
      caption: input.caption ?? null,
      location: input.location ?? null,
      takenAt: input.takenAt ?? new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const prev = get().byTrip[tripId] ?? [];
    set((s) => ({
      byTrip: {
        ...s.byTrip,
        [tripId]: sortByTakenAtAsc([...prev, optimistic]),
      },
      error: null,
    }));

    try {
      const saved = await createPhoto(input);
      assertAccount(started);
      set((s) => ({
        byTrip: {
          ...s.byTrip,
          [tripId]: sortByTakenAtAsc(
            (s.byTrip[tripId] ?? []).map((p) => (p.id === tempId ? saved : p)),
          ),
        },
      }));
    } catch (err) {
      assertAccount(started);

      set((s) => ({
        byTrip: {
          ...s.byTrip,
          [tripId]: (s.byTrip[tripId] ?? []).filter((p) => p.id !== tempId),
        },
        error: err instanceof Error ? err.message : i18n.t("errors.savePhoto"),
      }));
      throw err;
    }
  },

  editPhoto: async (tripId, id, patch) => {
    const started = accountVersion();
    assertAccount(started);

    const snapshot = get().byTrip[tripId] ?? [];
    set((s) => ({
      byTrip: {
        ...s.byTrip,
        [tripId]: sortByTakenAtAsc(
          snapshot.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        ),
      },
      error: null,
    }));

    try {
      const saved = await updatePhoto(id, patch);
      assertAccount(started);
      set((s) => ({
        byTrip: {
          ...s.byTrip,
          [tripId]: sortByTakenAtAsc(
            (s.byTrip[tripId] ?? []).map((p) => (p.id === id ? saved : p)),
          ),
        },
      }));
    } catch (err) {
      assertAccount(started);

      set((s) => ({
        byTrip: { ...s.byTrip, [tripId]: snapshot },
        error: err instanceof Error
          ? err.message
          : i18n.t("errors.updatePhoto"),
      }));
      throw err;
    }
  },

  removePhoto: async (tripId, photo) => {
    const started = accountVersion();
    assertAccount(started);

    const snapshot = get().byTrip[tripId] ?? [];
    set((s) => ({
      byTrip: {
        ...s.byTrip,
        [tripId]: snapshot.filter((p) => p.id !== photo.id),
      },
      error: null,
    }));

    try {
      await deletePhoto(photo);
      assertAccount(started);
    } catch (err) {
      assertAccount(started);

      set((s) => ({
        byTrip: { ...s.byTrip, [tripId]: snapshot },
        error: err instanceof Error
          ? err.message
          : i18n.t("errors.deletePhoto"),
      }));
      throw err;
    }
  },
}));

subscribeAccount(() =>
  usePhotoStore.setState({
    byTrip: {},
    loadingByTrip: {},
    error: null,
    errorByTrip: {},
  })
);
