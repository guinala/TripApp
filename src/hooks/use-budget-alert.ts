import { useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        Alert.alert(
          'Atención con el presupuesto',
          'Has gastado más del 80 % de tu presupuesto para este viaje.',
        );
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
