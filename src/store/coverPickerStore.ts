import { create } from 'zustand';
import type { UnsplashPhoto } from '@/services/unsplash';

type CoverPickerState = {
  selected: UnsplashPhoto | null;
  select: (photo: UnsplashPhoto) => void;
  consume: () => UnsplashPhoto | null;
};

export const useCoverPickerStore = create<CoverPickerState>((set, get) => ({
  selected: null,
  select: (photo) => set({ selected: photo }),
  consume: () => {
    const selected = get().selected;
    set({ selected: null });
    return selected;
  },
}));
