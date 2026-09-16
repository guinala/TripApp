import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import type { InterestCategory, LatLng } from '@/types/place';
import { usePlaceLanguage } from '@/hooks/use-place-details';
import { useNearbyPlaces } from '@/hooks/use-nearby-places';
import { PlaceResultRow } from './place-result-row';
import { PlacesButton, ui } from './places-ui';
import { PlacesStatus } from './places-status';
export function NearbyPlacesSection({ center }: { center: LatLng }) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<InterestCategory>('visit');
  const [enabled, setEnabled] = useState(false);
  const state = useNearbyPlaces(center, category, usePlaceLanguage(), enabled);
  return (
    <View style={{ gap: 12 }}>
      <Text style={ui.title}>{t('places.nearCenter')}</Text>
      <Text style={ui.text}>{t('places.nearbyScope')}</Text>
      <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>
        {(['visit', 'museum', 'park', 'restaurant'] as const).map((value) => (
          <PlacesButton
            key={value}
            secondary={value !== category || !enabled}
            title={t(`places.categories.${value}`)}
            onPress={() => {
              setCategory(value);
              setEnabled(true);
            }}
          />
        ))}
      </ScrollView>
      {enabled && (
        <PlacesStatus
          loading={state.loading}
          error={state.error}
          message={
            !state.loading && !state.error && !state.places.length
              ? t('places.noResults')
              : undefined
          }
          onRetry={state.error ? state.retry : undefined}
        />
      )}
      {state.places.map((place) => (
        <PlaceResultRow
          key={place.placeId}
          place={place}
          onPress={() =>
            router.push({ pathname: '/places/[placeId]', params: { placeId: place.placeId } })
          }
        />
      ))}
    </View>
  );
}
