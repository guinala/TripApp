import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useTripStore } from '@/store/tripStore';
import TripFilters, { TripFilter } from '@/components/TripFilters';
import TopBar from '@/components/bars/TopBar';
import { colors, fonts, fontSize } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import TripsEmptyState from '@/components/TripsEmptyState';
import { SwipeableTripCard } from '@/components/SwipeableTripCard';

export default function TripsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const trips = useTripStore((s) => s.trips);
  const loading = useTripStore((s) => s.loading);
  const fetchTrips = useTripStore((s) => s.fetchTrips);

  const [filter, setFilter] = useState<TripFilter>('all');

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ?? user?.email ?? 'nómada';
  const visibleTrips = useMemo(
    () => (filter === 'all' ? trips : trips.filter((t) => t.status === filter)),
    [trips, filter],
  );

  const nextTrip = trips.find((t) => t.status === 'planned');
  const claim = nextTrip ? `¿Listos para ${nextTrip.destination}?` : '¿A dónde vamos?';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <TopBar name={displayName} claim={claim} />

      <Text style={styles.heading}>
        Mis <Text style={styles.headingAccent}>Viajes</Text>
      </Text>

      <TripFilters active={filter} total={trips.length} onChange={setFilter} />

      <FlatList
        data={visibleTrips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SwipeableTripCard trip={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchTrips} tintColor={colors.primary} />
        }
        ListEmptyComponent={loading ? null : <TripsEmptyState />}
      />

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 96 }]}
        onPress={() => router.push('/trips/new')}
      >
        <Ionicons name="add" size={28} color={colors.surfacePaper} />
      </Pressable>
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
