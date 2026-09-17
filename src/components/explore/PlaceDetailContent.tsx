import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { PlaceDetails } from '@/types/place';
import { PlacesAttribution } from './PlacesAttribution';
import { PlacesButton, ui } from './PlacesUI';
import { PlacesStatus } from './PlacesStatus';
import { NearbyPlacesSection } from './NearbyPlacesSection';
import { DestinationStatsCard } from './DestinationStatsCard';
export function PlaceDetailContent({
  place,
  editorial,
}: {
  place: PlaceDetails;
  editorial?: { description: string; descriptionLanguage: 'es' | 'en' };
}) {
  const { t } = useTranslation();
  const [linkError, setLinkError] = useState<string | null>(null);
  const city = place.types.some((type) =>
    ['locality', 'postal_town', 'administrative_area_level_3'].includes(type),
  );
  const destination =
    city ||
    place.types.some((type) =>
      ['country', 'administrative_area_level_1', 'administrative_area_level_2'].includes(type),
    );
  return (
    <View style={{ gap: 16 }}>
      <Text style={ui.heading}>{place.name}</Text>
      {place.address && <Text style={ui.text}>{place.address}</Text>}
      <Text style={ui.text}>{t(destination ? 'places.destinationType' : 'places.placeType')}</Text>
      <PlacesAttribution attributions={place.attributions} />
      {editorial?.description ? (
        <View style={ui.card}>
          <Text style={ui.title}>{t('places.editorial')}</Text>
          <Text style={ui.text} accessibilityLanguage={editorial.descriptionLanguage}>
            {editorial.description}
          </Text>
          <Text style={ui.text}>
            {t('places.textLanguage', { language: editorial.descriptionLanguage.toUpperCase() })}
          </Text>
        </View>
      ) : null}
      {destination ? (
        <PlacesButton
          title={t('places.createTrip')}
          onPress={() =>
            router.push({ pathname: '/trips/new', params: { placeId: place.placeId } })
          }
        />
      ) : (
        <PlacesButton
          title={t('places.addToTrip')}
          onPress={() =>
            router.push({ pathname: '/places/[placeId]/trips', params: { placeId: place.placeId } })
          }
        />
      )}
      <PlacesButton
        secondary
        title={t(destination ? 'places.addToTrip' : 'places.createTrip')}
        onPress={() =>
          destination
            ? router.push({
                pathname: '/places/[placeId]/trips',
                params: { placeId: place.placeId },
              })
            : router.push({ pathname: '/trips/new', params: { placeId: place.placeId } })
        }
      />
      {place.googleMapsUri && /^https:\/\//i.test(place.googleMapsUri) && (
        <PlacesButton
          secondary
          title={t('places.openMaps')}
          onPress={() => {
            void Linking.openURL(place.googleMapsUri!).catch(() => setLinkError('link'));
          }}
        />
      )}
      <PlacesStatus error={linkError} />
      {city && <DestinationStatsCard location={place.location} />}
      {city && place.location && <NearbyPlacesSection center={place.location} />}
    </View>
  );
}
