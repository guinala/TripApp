import { useState } from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTripRecord } from '@/hooks/use-trip-record';
import { useTripStore } from '@/store/tripStore';
import { DestinationInput } from '@/components/trips/DestinationInput';
import { PlacesScreen, PlacesButton, ui } from '@/components/explore/places-ui';
import { PlacesStatus } from '@/components/explore/places-status';
import { PlacesAttribution } from '@/components/explore/places-attribution';
import { usePlaceDetails, usePlaceLanguage } from '@/hooks/use-place-details';
import type { Trip } from '@/types/trip';

function Form({ trip }: { trip: Trip }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(trip.destination);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const resolution = usePlaceDetails(placeId, usePlaceLanguage());
  const [selecting, setSelecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    if (!placeId || saving || selecting) return;
    setSaving(true);
    setError(null);
    try {
      await useTripStore.getState().editTrip(trip.id, { destinationPlaceId: placeId });
      router.replace({ pathname: '/trips/[id]/itinerary', params: { id: trip.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'save');
      setSaving(false);
    }
  };
  return (
    <>
      <Text style={ui.text}>{t('places.locateExplanation')}</Text>
      <DestinationInput
        value={
          resolution.place
            ? [resolution.place.name, resolution.place.countryName].filter(Boolean).join(', ')
            : query
        }
        onChangeText={(text) => {
          setQuery(text);
          setPlaceId(null);
        }}
        onSelectPlace={(place) => {
          setPlaceId(place.placeId);
          setQuery([place.name, place.countryName].filter(Boolean).join(', '));
        }}
        onSelectingChange={setSelecting}
        disabled={saving}
      />
      {placeId && <PlacesAttribution attributions={resolution.place?.attributions} />}
      <PlacesStatus error={error} />
      <PlacesButton
        title={t(saving ? 'common.saving' : 'common.save')}
        disabled={!placeId || saving || selecting}
        onPress={() => {
          void save();
        }}
      />
    </>
  );
}

export default function LocateDestination() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const state = useTripRecord(id);
  return (
    <PlacesScreen title={t('places.resolveDestination')}>
      {state.trip ? (
        <Form key={state.trip.id} trip={state.trip} />
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
