import { useEffect, type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { useProfileStore } from '@/store/profileStore';
import { useAuthStore } from '@/store/authStore';
import { useTripStore } from '@/store/tripStore';
import { useUIStore } from '@/store/uiStore';
import { accountOwner } from '@/services/account-session';
import { resyncNotifications } from '@/services/notifications';
import { syncLanguage } from '@/i18n';
import { LoadNotice } from '@/components/ui/LoadNotice';
import { PlacesButton } from '@/components/explore/PlacesUI';

export function AccountBoundary({ userId, children }: { userId: string; children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const profile = useProfileStore((s) => s.profile);
  const loading = useProfileStore((s) => s.loading);
  const error = useProfileStore((s) => s.error);
  const load = useProfileStore((s) => s.load);
  const trips = useTripStore((s) => s.trips);
  const tripsLoaded = useTripStore((s) => s.loaded);
  const tripReminders = useUIStore((s) => s.notifTripReminders);
  const budgetSummary = useUIStore((s) => s.notifBudgetSummary);
  const weeklyInspiration = useUIStore((s) => s.notifWeeklyInspiration);
  const pending = !!profile?.deletionRequestedAt;

  useEffect(() => {
    void load(userId);
  }, [userId, load]);

  useEffect(() => {
    if (profile && !pending) syncLanguage(profile.preferredLanguage);
  }, [profile, pending]);

  useEffect(() => {
    if (profile && !pending) void useTripStore.getState().fetchTrips();
  }, [profile, pending]);

  useEffect(() => {
    if (!tripsLoaded || pending) return;

    void resyncNotifications(trips, { tripReminders, budgetSummary, weeklyInspiration }).catch(
      () => {},
    );
  }, [trips, tripsLoaded, pending, tripReminders, budgetSummary, weeklyInspiration, i18n.language]);

  useEffect(() => {
    if (Platform.OS === 'web' || !profile || pending) return;

    let cancelled = false;
    let handled: string | undefined;

    function open(response: Notifications.NotificationResponse) {
      const notification = response.notification;
      const data = notification.request.content.data;

      if (
        cancelled ||
        handled === notification.request.identifier ||
        !data ||
        data.userId !== accountOwner()
      )
        return;
      handled = notification.request.identifier;

      if (data.kind === 'trip-reminder' && typeof data.tripId === 'string')
        router.push({ pathname: '/trips/[id]/itinerary', params: { id: data.tripId } });
      else if (data.kind === 'weekly-inspiration') router.push('/(app)/(tabs)/explore');
      else if (data.kind === 'budget-summary') router.push('/(app)/(tabs)');

      void Notifications.clearLastNotificationResponseAsync();
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) open(response);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [profile, pending]);

  if (!profile || pending)
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16 }}>
        <LoadNotice
          loading={!pending && (loading || !error)}
          error={!!error}
          message={pending ? t('fixes.accountPending') : undefined}
          onRetry={pending ? undefined : () => void load(userId)}
        />
        <PlacesButton
          secondary
          title={t('settings.signOut.title')}
          onPress={() => {
            void useAuthStore
              .getState()
              .signOut()
              .catch(() => {});
          }}
        />
      </View>
    );

  return children;
}
