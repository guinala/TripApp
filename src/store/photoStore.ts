import { create } from 'zustand';
import type { Photo } from '@/types/photo';
import {
  listPhotos,
  createPhoto,
  updatePhoto,
  deletePhoto,
  type CreatePhotoInput,
  type UpdatePhotoInput,
} from '@/services/photos';

type PhotoState = {
  byTrip: Record<string, Photo[]>;
  loadingByTrip: Record<string, boolean>;
  error: string | null;

  loadPhotos: (tripId: string) => Promise<void>;
  addPhoto: (input: CreatePhotoInput) => Promise<void>;
  editPhoto: (tripId: string, id: string, patch: UpdatePhotoInput) => Promise<void>;
  removePhoto: (tripId: string, photo: Photo) => Promise<void>;
};

const sortByTakenAtAsc = (list: Photo[]): Photo[] =>
  [...list].sort((a, b) => a.takenAt.localeCompare(b.takenAt));

export const usePhotoStore = create<PhotoState>((set, get) => ({
  byTrip: {},
  loadingByTrip: {},
  error: null,

  loadPhotos: async (tripId) => {
    set((s) => ({
      loadingByTrip: { ...s.loadingByTrip, [tripId]: true },
      error: null,
    }));
    try {
      const photos = await listPhotos(tripId);
      set((s) => ({
        byTrip: { ...s.byTrip, [tripId]: photos },
        loadingByTrip: { ...s.loadingByTrip, [tripId]: false },
      }));
    } catch (err) {
      set((s) => ({
        loadingByTrip: { ...s.loadingByTrip, [tripId]: false },
        error: err instanceof Error ? err.message : 'No se pudieron cargar las fotos',
      }));
    }
  },

  addPhoto: async (input) => {
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
      byTrip: { ...s.byTrip, [tripId]: sortByTakenAtAsc([...prev, optimistic]) },
      error: null,
    }));

    try {
      const saved = await createPhoto(input);
      set((s) => ({
        byTrip: {
          ...s.byTrip,
          [tripId]: sortByTakenAtAsc(
            (s.byTrip[tripId] ?? []).map((p) => (p.id === tempId ? saved : p)),
          ),
        },
      }));
    } catch (err) {
      set((s) => ({
        byTrip: {
          ...s.byTrip,
          [tripId]: (s.byTrip[tripId] ?? []).filter((p) => p.id !== tempId),
        },
        error: err instanceof Error ? err.message : 'No se pudo guardar la foto',
      }));
      throw err;
    }
  },

  editPhoto: async (tripId, id, patch) => {
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
      set((s) => ({
        byTrip: {
          ...s.byTrip,
          [tripId]: sortByTakenAtAsc((s.byTrip[tripId] ?? []).map((p) => (p.id === id ? saved : p))),
        },
      }));
    } catch (err) {
      set((s) => ({
        byTrip: { ...s.byTrip, [tripId]: snapshot },
        error: err instanceof Error ? err.message : 'No se pudo actualizar la foto',
      }));
      throw err;
    }
  },

  removePhoto: async (tripId, photo) => {
    const snapshot = get().byTrip[tripId] ?? [];
    set((s) => ({
      byTrip: { ...s.byTrip, [tripId]: snapshot.filter((p) => p.id !== photo.id) },
      error: null,
    }));

    try {
      await deletePhoto(photo);
    } catch (err) {
      set((s) => ({
        byTrip: { ...s.byTrip, [tripId]: snapshot },
        error: err instanceof Error ? err.message : 'No se pudo eliminar la foto',
      }));
      throw err;
    }
  },
}));
