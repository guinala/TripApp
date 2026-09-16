import { create } from "zustand";

type State = {
  revisions: Record<string, number>;
  invalidate: (id: string) => void;
  reset: () => void;
};

export const useItineraryRefreshStore = create<State>((set) => ({
  revisions: {},
  invalidate: (id) =>
    set((s) => ({
      revisions: { ...s.revisions, [id]: (s.revisions[id] ?? 0) + 1 },
    })),
  reset: () => set({ revisions: {} }),
}));
