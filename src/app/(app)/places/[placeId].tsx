import { useIsFocused, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePlaceLanguage } from '@/hooks/use-place-details';
import { usePlaceContent } from '@/hooks/use-place-content';
import { PlacesScreen } from '@/components/explore/PlacesUI';
import { PlacesStatus } from '@/components/explore/PlacesStatus';
import { PlaceDetailContent } from '@/components/explore/PlaceDetailContent';

export default function PlaceScreen() {
  const { placeId } = useLocalSearchParams<{ placeId?: string | string[] }>();
  const id = typeof placeId === 'string' && placeId.trim() ? placeId : null;
  const { t } = useTranslation();
  const focused = useIsFocused();
  const resolution = usePlaceContent(id, usePlaceLanguage(), focused);
  if (resolution.content) return <PlaceDetailContent key={id} content={resolution.content} />;
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
