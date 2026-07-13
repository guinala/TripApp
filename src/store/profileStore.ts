import { create } from 'zustand';
import { getProfile, updateProfile, type UpdateProfileInput } from '@/services/profiles';
import type { Profile } from '@/types/profile';

type ProfileState = {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  load: (userId: string) => Promise<void>;
  update: (userId: string, input: UpdateProfileInput) => Promise<void>;
  setAvatarUrl: (url: string) => void;
  clear: () => void;
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  load: async (userId) => {
    set({ loading: true, error: null });
    try {
      const profile = await getProfile(userId);
      set({ profile, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Error cargando perfil', loading: false });
    }
  },

  update: async (userId, input) => {
    const snapshot = get().profile;
    if (!snapshot) return;
    set({ profile: { ...snapshot, ...input } as Profile });
    try {
      const updated = await updateProfile(userId, input);
      set({ profile: updated });
    } catch (e) {
      set({ profile: snapshot, error: e instanceof Error ? e.message : 'Error guardando' });
      throw e;
    }
  },

  setAvatarUrl: (url) => {
    const p = get().profile;
    if (p) set({ profile: { ...p, avatarUrl: url } });
  },

  clear: () => set({ profile: null, error: null }),
}));
