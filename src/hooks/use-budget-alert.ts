import { useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';

const THRESHOLD = 80;

export function useBudgetAlert(tripId: string, percentage: number | null) {
  useEffect(() => {
    if (percentage === null) return;

    const key = `budget-alert-80:${tripId}`;

    (async () => {
      let alreadyNotified = false;
      try {
        alreadyNotified = (await AsyncStorage.getItem(key)) === '1';
      } catch {}

      if (percentage >= THRESHOLD && !alreadyNotified) {
        Alert.alert(i18n.t('budget.alert.title'), i18n.t('budget.alert.message'));
        try {
          await AsyncStorage.setItem(key, '1');
        } catch {}
      } else if (percentage < THRESHOLD && alreadyNotified) {
        try {
          await AsyncStorage.removeItem(key);
        } catch {}
      }
    })();
  }, [tripId, percentage]);
}
