import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePlaceDetails, usePlaceLanguage } from '@/hooks/use-place-details';
import { PlacesScreen } from '@/components/explore/PlacesUI';
import { PlacesStatus } from '@/components/explore/PlacesStatus';
import type { PlaceDetails } from '@/types/place';
import { useEditorialForPlace } from '@/hooks/use-editorial-place';
import { PlaceDetailContent } from '@/components/explore/PlaceDetailContent';

function PlaceBody({ place }: { place: PlaceDetails }) {
  const editorial = useEditorialForPlace(place);
  return <PlaceDetailContent place={place} editorial={editorial} />;
}

export default function PlaceScreen() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const { t } = useTranslation();
  const resolution = usePlaceDetails(placeId ?? null, usePlaceLanguage());
  if (resolution.place) return <PlaceBody key={placeId} place={resolution.place} />;
  return (
    <PlacesScreen title={t('places.details')}>
      <PlacesStatus
        loading={resolution.status === 'loading'}
        error={resolution.error}
        message={resolution.status === 'unresolved' ? t('places.locationUnavailable') : undefined}
        onRetry={resolution.error ? resolution.retry : undefined}
      />
    </PlacesScreen>
  );
}
