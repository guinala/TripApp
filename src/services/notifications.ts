import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { parseISO, setHours, setMinutes, subDays } from 'date-fns';
import i18n from '@/i18n';
import type { Trip } from '@/types/trip';

export type NotificationPrefs = {
  tripReminders: boolean;
  budgetSummary: boolean;
  weeklyInspiration: boolean;
};

export function initNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    // Android exige un canal
    Notifications.setNotificationChannelAsync('default', {
      name: 'General',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E26D4F',
    });
  }
}

/** true si tenemos permiso */
export async function ensureNotificationPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function tripReminderDate(trip: Trip): Date {
  return setMinutes(setHours(subDays(parseISO(trip.startDate), 1), 9), 0);
}

export async function resyncNotifications(trips: Trip[], prefs: NotificationPrefs): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;

  if (prefs.tripReminders) {
    const now = new Date();
    const upcoming = trips.filter((t) => t.status !== 'completed' && tripReminderDate(t) > now);
    for (const trip of upcoming) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('notifications.tripReminder.title', { title: trip.title }),
          body: i18n.t('notifications.tripReminder.body', { destination: trip.destination }),
          data: { kind: 'trip-reminder', tripId: trip.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: tripReminderDate(trip),
        },
      });
    }
  }

  if (prefs.budgetSummary) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifications.budgetSummary.title'),
        body: i18n.t('notifications.budgetSummary.body'),
        data: { kind: 'budget-summary' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 2,
        hour: 9,
        minute: 0,
      },
    });
  }

  if (prefs.weeklyInspiration) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifications.weeklyInspiration.title'),
        body: i18n.t('notifications.weeklyInspiration.body'),
        data: { kind: 'weekly-inspiration' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 6,
        hour: 18,
        minute: 0,
      },
    });
  }
}
