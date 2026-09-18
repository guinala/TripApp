import { useCallback } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PlacesButton, PlacesScreen } from '@/components/explore/PlacesUI';
import { LoadNotice } from '@/components/ui/LoadNotice';
import { useTripStore } from '@/store/tripStore';

export default function ProfileTripsScreen() {
  const { t } = useTranslation();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const trips = useTripStore((s) => s.trips);
  const loading = useTripStore((s) => s.loading);
  const error = useTripStore((s) => s.error);
  const fetchTrips = useTripStore((s) => s.fetchTrips);

  useFocusEffect(
    useCallback(() => {
      void fetchTrips();
    }, [fetchTrips]),
  );

  return (
    <PlacesScreen title={t('fixes.chooseTrip')}>
      <LoadNotice loading={loading} error={!!error} onRetry={fetchTrips} />
      {!loading && !error && !trips.length && (
        <PlacesButton title={t('home.newTrip')} onPress={() => router.push('/trips/new')} />
      )}
      {trips.map((trip) => (
        <PlacesButton
          key={trip.id}
          secondary
          title={trip.title}
          onPress={() =>
            router.push({
              pathname: section === 'packing' ? '/trips/[id]/packing' : '/trips/[id]/diary',
              params: { id: trip.id },
            })
          }
        />
      ))}
    </PlacesScreen>
  );
}
