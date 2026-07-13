import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UIState = {
  /** Caché local de profiles.preferred_language para arranque sin red */
  language: string;
  notifTripReminders: boolean;
  notifBudgetSummary: boolean;
  notifWeeklyInspiration: boolean;
  setLanguage: (lang: string) => void;
  setNotif: (
    key: 'notifTripReminders' | 'notifBudgetSummary' | 'notifWeeklyInspiration',
    value: boolean,
  ) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      language: 'es',
      notifTripReminders: true,
      notifBudgetSummary: true,
      notifWeeklyInspiration: false,
      setLanguage: (language) => set({ language }),
      setNotif: (key, value) => set({ [key]: value }),
    }),
    {
      name: 'tripmate-ui',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
