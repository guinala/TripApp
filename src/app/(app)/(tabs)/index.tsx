import { LoadNotice } from '@/components/ui/LoadNotice';
import { useLocalToday } from '@/hooks/use-local-today';
import { tripStatus } from '@/utils/tripStatus';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import type { ViewToken } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIsFocused, useRouter } from 'expo-router';
import { useTripDestinationLabel } from '@/hooks/use-trip-destination-label';
import { PlacesAttribution } from '@/components/explore/PlacesAttribution';
import { PlacesStatus } from '@/components/explore/PlacesStatus';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useTripStore } from '@/store/tripStore';
import TripFilters, { TripFilter } from '@/components/trips/TripFilters';
import TopBar from '@/components/bars/TopBar';
import { colors, fonts, fontSize } from '@/constants/theme';
import TripsEmptyState from '@/components/trips/TripsEmptyState';
import { SwipeableTripCard } from '@/components/trips/SwipeableTripCard';
import { Fab } from '@/components/ui/Fab';
import { useTranslation } from 'react-i18next';

const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 50 };

export default function TripsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const savedTrips = useTripStore((s) => s.trips);
  const today = useLocalToday();
  const trips = useMemo(
    () =>
      savedTrips.map((trip) => ({
        ...trip,
        status: tripStatus(trip.startDate, trip.endDate, today),
      })),
    [savedTrips, today],
  );
  const loading = useTripStore((s) => s.loading);
  const error = useTripStore((s) => s.error);
  const fetchTrips = useTripStore((s) => s.fetchTrips);

  const [filter, setFilter] = useState<TripFilter>('all');
  const focused = useIsFocused();
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) =>
      setVisibleIds(new Set(viewableItems.map((item) => item.key))),
    [],
  );

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email ??
    t('home.defaultName');
  const visibleTrips = useMemo(
    () => (filter === 'all' ? trips : trips.filter((trip) => trip.status === filter)),
    [trips, filter],
  );

  const nextTrip = trips.find((trip) => trip.status === 'planned');
  const destination = useTripDestinationLabel(nextTrip ?? null, focused);
  const claim = nextTrip
    ? t('home.claimNext', { destination: destination.label })
    : t('home.claimIdle');

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <TopBar name={displayName} claim={claim} />
      {destination.place && <PlacesAttribution attributions={destination.place.attributions} />}
      {error && <PlacesStatus error={error} onRetry={fetchTrips} />}

      <Text style={styles.heading}>
        {t('home.titleStart')}
        <Text style={styles.headingAccent}>{t('home.titleAccent')}</Text>
      </Text>

      {trips.length > 0 && (
        <TripFilters active={filter} total={trips.length} onChange={setFilter} />
      )}

      <FlatList
        data={visibleTrips}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SwipeableTripCard trip={item} resolveDestination={focused && visibleIds.has(item.id)} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchTrips} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          loading || error ? null : trips.length > 0 ? (
            <LoadNotice message={t('fixes.emptyFilter')} onRetry={() => setFilter('all')} />
          ) : (
            <TripsEmptyState />
          )
        }
      />

      <Fab
        onPress={() => router.push('/trips/new')}
        bottomOffset={76}
        accessibilityLabel={t('home.newTrip')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfacePaper, paddingHorizontal: 20, gap: 16 },
  heading: { fontFamily: fonts.serif, fontSize: fontSize.textSm, color: colors.secondary },
  headingAccent: { fontFamily: fonts.serifItalic, color: colors.primary },
  list: { gap: 14, paddingBottom: 120 },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});
