import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePlaceDetails, usePlaceLanguage } from '@/hooks/use-place-details';
import { PlacesScreen } from '@/components/explore/PlacesUI';
import { PlacesStatus } from '@/components/explore/PlacesStatus';
import { PlaceDetailContent } from '@/components/explore/PlaceDetailContent';

export default function PlaceScreen() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const { t } = useTranslation();
  const resolution = usePlaceDetails(placeId ?? null, usePlaceLanguage());
  return (
    <PlacesScreen title={t('places.details')}>
      {resolution.place ? (
        <PlaceDetailContent key={placeId} place={resolution.place} />
      ) : (
        <PlacesStatus
          loading={resolution.status === 'loading'}
          error={resolution.error}
          message={resolution.status === 'unresolved' ? t('places.locationUnavailable') : undefined}
          onRetry={resolution.error ? resolution.retry : undefined}
        />
      )}
    </PlacesScreen>
  );
}
