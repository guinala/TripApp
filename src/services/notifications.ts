import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { create } from "zustand";
import { parseISO, setHours, setMinutes, subDays } from "date-fns";
import i18n from "@/i18n";
import type { Trip } from "@/types/trip";
import {
  accountOwner,
  accountVersion,
  subscribeAccount,
} from "./account-session";

export type NotificationPrefs = {
  tripReminders: boolean;
  budgetSummary: boolean;
  weeklyInspiration: boolean;
};

export const useNotificationStatus = create<{ error: boolean }>(() => ({
  error: false,
}));

let revision = 0;
let tail: Promise<void> = Promise.resolve();

const disabled = {
  tripReminders: false,
  budgetSummary: false,
  weeklyInspiration: false,
};

export function initNotifications() {
  if (Platform.OS === "web") return;

  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const own =
        notification.request.content.data?.userId === accountOwner() &&
        accountOwner() !== null;
      return {
        shouldShowBanner: own,
        shouldShowList: own,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    },
  });

  if (Platform.OS === "android") {
    void Notifications.setNotificationChannelAsync("default", {
      name: "General",
      importance: Notifications.AndroidImportance.DEFAULT,
    }).catch(() => useNotificationStatus.setState({ error: true }));
  }
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  return (await Notifications.requestPermissionsAsync()).granted;
}

function reminderDate(trip: Trip) {
  return setMinutes(setHours(subDays(parseISO(trip.startDate), 1), 9), 0);
}

export function resyncNotifications(
  trips: Trip[],
  prefs: NotificationPrefs,
): Promise<void> {
  if (Platform.OS === "web") return Promise.resolve();
  const request = ++revision;
  const version = accountVersion(),
    owner = accountOwner();
  const current = () => request === revision && version === accountVersion();
  const task = tail
    .catch(() => {})
    .then(async () => {
      if (!current()) return;
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
      if (!current()) return;
      if (!owner) {
        await Notifications.dismissAllNotificationsAsync();
        return;
      }

      const permissions = await Notifications.getPermissionsAsync();
      if (!current() || !permissions.granted) return;

      // Deja margen al límite de notificaciones pendientes del sistema.
      const upcoming = trips
        .filter((trip) => reminderDate(trip) > new Date())
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, 50);

      if (prefs.tripReminders) {
        for (const trip of upcoming) {
          if (!current()) return;
          await Notifications.scheduleNotificationAsync({
            content: {
              title: i18n.t("notifications.tripReminder.title", {
                title: trip.title,
              }),
              body: i18n.t("notifications.tripReminder.body", {
                destination: trip.destination,
              }),
              data: { kind: "trip-reminder", tripId: trip.id, userId: owner },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: reminderDate(trip),
              channelId: "default",
            },
          });
        }
      }

      if (current() && prefs.budgetSummary && trips.length) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: i18n.t("notifications.budgetSummary.title"),
            body: i18n.t("notifications.budgetSummary.body"),
            data: { kind: "budget-summary", userId: owner },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: 2,
            hour: 9,
            minute: 0,
            channelId: "default",
          },
        });
      }

      if (current() && prefs.weeklyInspiration) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: i18n.t("notifications.weeklyInspiration.title"),
            body: i18n.t("notifications.weeklyInspiration.body"),
            data: { kind: "weekly-inspiration", userId: owner },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: 6,
            hour: 18,
            minute: 0,
            channelId: "default",
          },
        });
      }
    });

  tail = task;

  return task.then(
    () => {
      if (current()) useNotificationStatus.setState({ error: false });
    },
    (error) => {
      if (current()) useNotificationStatus.setState({ error: true });
      throw error;
    },
  );
}

subscribeAccount(() => {
  void resyncNotifications([], disabled).catch(() => {});
});
