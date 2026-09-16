import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTripRecord } from '@/hooks/use-trip-record';
import { usePlaceDetails, usePlaceLanguage } from '@/hooks/use-place-details';
import { ensureDays } from '@/services/days';
import { createActivity, listActivitiesByTrip } from '@/services/activities';
import { ActivityForm } from '@/components/itinerary/ActivityForm';
import { PlacesScreen, PlacesButton } from '@/components/explore/PlacesUI';
import { PlacesStatus } from '@/components/explore/PlacesStatus';
import { useItineraryRefreshStore } from '@/store/itineraryRefreshStore';
import { useAuthStore } from '@/store/authStore';
import type { Trip } from '@/types/trip';
import type { Day } from '@/types/day';

function Form({ trip, placeId }: { trip: Trip; placeId: string }) {
  const { t } = useTranslation();
  const [days, setDays] = useState<Day[] | null>(null);
  const [dayId, setDayId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const resolution = usePlaceDetails(trip.destinationPlaceId, usePlaceLanguage());
  useEffect(() => {
    let cancelled = false;
    ensureDays(trip)
      .then((data) => {
        if (!cancelled) {
          setDays(data);
          setDayId((id) => (data.some((d) => d.id === id) ? id : (data[0]?.id ?? null)));
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'load');
      });
    return () => {
      cancelled = true;
    };
  }, [trip, attempt]);
  if (!days || !dayId)
    return (
      <PlacesStatus
        loading={!days && !error}
        error={error}
        message={days && !dayId ? t('places.noDays') : undefined}
        onRetry={() => {
          setError(null);
          setAttempt((a) => a + 1);
        }}
      />
    );
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ padding: 16, gap: 8 }}
      >
        {days.map((day) => (
          <PlacesButton
            key={day.id}
            title={`${t('itinerary.dayFilter.day', { number: day.dayNumber })} · ${day.date}`}
            secondary={day.id !== dayId}
            disabled={saving}
            onPress={() => setDayId(day.id)}
          />
        ))}
      </ScrollView>
      <ActivityForm
        dayId={dayId}
        currency={trip.currency}
        initialPlaceId={placeId}
        center={resolution.place?.location ?? undefined}
        onSavingChange={setSaving}
        onCancel={() => router.back()}
        onSubmit={async (input) => {
          const existing = await listActivitiesByTrip(trip.id);
          const orderIndex =
            Math.max(
              -1,
              ...existing.filter((a) => a.dayId === input.dayId).map((a) => a.orderIndex),
            ) + 1;
          if (useAuthStore.getState().user?.id !== trip.userId)
            throw new Error('La sesión ha cambiado');
          await createActivity({ ...input, orderIndex });
          if (useAuthStore.getState().user?.id !== trip.userId) return;
          useItineraryRefreshStore.getState().invalidate(trip.id);
          router.replace({ pathname: '/trips/[id]/itinerary', params: { id: trip.id } });
        }}
      />
    </View>
  );
}

export default function NewActivity() {
  const { id, placeId } = useLocalSearchParams<{ id: string; placeId: string }>();
  const { t } = useTranslation();
  const state = useTripRecord(id);
  return (
    <PlacesScreen title={t('itinerary.newActivity')} scroll={false}>
      {state.trip ? (
        <Form key={`${id}:${placeId}`} trip={state.trip} placeId={placeId} />
      ) : (
        <PlacesStatus
          loading={state.loading}
          error={state.error}
          message={!state.loading && !state.error ? t('places.tripNotFound') : undefined}
          onRetry={state.retry}
        />
      )}
    </PlacesScreen>
  );
}
