import {
  accountOwner,
  accountVersion,
  isCurrentAccount,
} from "@/services/account-session";
import { useEffect } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@/i18n";

const THRESHOLD = 80;

export function useBudgetAlert(tripId: string, percentage: number | null) {
  useEffect(() => {
    if (percentage === null) return;

    const started = accountVersion();
    let cancelled = false;
    const key = `budget-alert-80:${accountOwner()}:${tripId}`;

    (async () => {
      let alreadyNotified = false;
      try {
        alreadyNotified = (await AsyncStorage.getItem(key)) === "1";
      } catch {}

      if (cancelled || !isCurrentAccount(started)) return;
      if (percentage >= THRESHOLD && !alreadyNotified) {
        Alert.alert(
          i18n.t("budget.alert.title"),
          i18n.t("budget.alert.message"),
        );
        try {
          await AsyncStorage.setItem(key, "1");
        } catch {}
      } else if (percentage < THRESHOLD && alreadyNotified) {
        try {
          await AsyncStorage.removeItem(key);
        } catch {}
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tripId, percentage]);
}
