import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTripDetail } from '@/context/TripDetailContext';
import { PlacesStatus } from '@/components/explore/PlacesStatus';
import { PlacesButton } from '@/components/explore/PlacesUI';
export function PlaceMapStatus({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const {
    trip,
    destinationResolution: resolution,
    retryDestination,
    missingLocations,
    locationsLoading,
    locationFailures,
    retryActivityLocations,
  } = useTripDetail();
  const locate = () => {
    onNavigate?.();
    router.push({ pathname: '/trips/[id]/destination', params: { id: trip.id } });
  };
  return (
    <View style={{ gap: 8 }}>
      {!compact && (
        <PlacesStatus
          loading={resolution.status === 'loading'}
          error={resolution.error}
          message={
            resolution.status === 'unresolved'
              ? t('places.manualDestination')
              : resolution.status === 'ready'
                ? t('places.locationUnavailable')
                : undefined
          }
          onRetry={resolution.error ? retryDestination : undefined}
        />
      )}
      {(!trip.destinationPlaceId || resolution.error?.code === 'NOT_FOUND') && (
        <PlacesButton title={t('places.resolveDestination')} onPress={locate} secondary />
      )}
      {missingLocations > 0 && (
        <PlacesStatus
          loading={locationsLoading}
          message={t('places.partialLocationsCount', { count: missingLocations })}
          onRetry={locationFailures ? retryActivityLocations : undefined}
        />
      )}
    </View>
  );
}
