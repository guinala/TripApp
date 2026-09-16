import { useEffect } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTripStore } from '@/store/tripStore';
import { PlacesScreen, PlacesButton, ui } from '@/components/explore/PlacesUI';
import { PlacesStatus } from '@/components/explore/PlacesStatus';

export default function ChooseTrip() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const { t } = useTranslation();
  const { trips, fetchTrips, loading, error } = useTripStore();
  useEffect(() => {
    void fetchTrips();
  }, [fetchTrips]);
  return (
    <PlacesScreen title={t('places.chooseTrip')} scroll={false}>
      <View style={{ paddingHorizontal: 20 }}>
        <PlacesButton
          title={t('places.createTrip')}
          onPress={() => router.push({ pathname: '/trips/new', params: { placeId } })}
        />
        <PlacesStatus loading={loading} error={error} onRetry={error ? fetchTrips : undefined} />
      </View>
      <FlatList
        data={trips}
        keyExtractor={(trip) => trip.id}
        contentContainerStyle={ui.body}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            style={ui.card}
            onPress={() =>
              router.push({
                pathname: '/trips/[id]/activities/new',
                params: { id: item.id, placeId },
              })
            }
          >
            <Text style={ui.title}>{item.title}</Text>
            <Text style={ui.text}>
              {item.startDate} · {item.endDate}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading && !error ? <PlacesStatus message={t('places.noTrips')} /> : null
        }
      />
    </PlacesScreen>
  );
}
