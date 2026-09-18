import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams, useSegments, withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from 'expo-router/js-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { TripDetailProvider } from '@/context/TripDetailContext';
import { useTripStore } from '@/store/tripStore';
import TripMap from '@/components/maps/TripMap';
import DayFilter from '@/components/trips/DayFilter';
import { useState } from 'react';
import { FullMapModal } from '@/components/maps/FullMapModal';
import { useTripRecord } from '@/hooks/use-trip-record';
import { useTripDestinationLabel } from '@/hooks/use-trip-destination-label';
import { PlacesScreen } from '@/components/explore/PlacesUI';
import { PlacesStatus } from '@/components/explore/PlacesStatus';
import { PlacesAttribution } from '@/components/explore/PlacesAttribution';

const { Navigator } = createMaterialTopTabNavigator();
const MaterialTopTabs = withLayoutContext(Navigator);

export default function TripDetailLayout() {
  const { t } = useTranslation();
  const segments = useSegments();
  const showMap = segments[segments.length - 1] === 'itinerary';
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip, loading, error, retry } = useTripRecord(id);
  const destination = useTripDestinationLabel(trip);
  const removeTrip = useTripStore((s) => s.removeTrip);
  const [mapOpen, setMapOpen] = useState(false);

  const handleDeleteTrip = () => {
    Alert.alert(t('trips.delete.title'), t('trips.delete.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await removeTrip(id);
            router.replace('/(app)/(tabs)');
          } catch {
            Alert.alert(t('common.error'), t('common.tryAgain'));
          }
        },
      },
    ]);
  };

  if (!trip)
    return (
      <PlacesScreen title={t('trips.form.name')}>
        <PlacesStatus
          loading={loading}
          error={error}
          message={!loading && !error ? t('places.tripNotFound') : undefined}
          onRetry={retry}
        />
      </PlacesScreen>
    );

  return (
    <TripDetailProvider trip={trip}>
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.surfaceCream }}>
        <View style={{ paddingHorizontal: spacing.s5, paddingVertical: spacing.s3 }}>
          <View style={styles.detailHeader}>
            <Pressable onPress={() => router.back()}>
              <Text
                style={{
                  fontFamily: fonts.sansRegular,
                  fontSize: fontSize.input,
                  color: colors.secondary,
                }}
              >
                ‹ {t('common.back')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={{ minHeight: 44, justifyContent: 'center' }}
              onPress={() => router.push({ pathname: '/trips/new', params: { id } })}
            >
              <Text style={{ color: colors.primary }}>{t('common.edit')}</Text>
            </Pressable>
            <Pressable
              onPress={handleDeleteTrip}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('common.delete')}
            >
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </Pressable>
          </View>
          <Text
            style={{
              fontFamily: fonts.serifItalic,
              fontSize: fontSize.title,
              color: colors.secondary,
              marginTop: spacing.s2,
            }}
          >
            {trip.title}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          <Text style={{ color: colors.secondary }}>{destination.label}</Text>
          {destination.place && <PlacesAttribution attributions={destination.place.attributions} />}
        </View>
        {showMap && (
          <>
            <TripMap />

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <DayFilter />
              </View>
              <Pressable onPress={() => setMapOpen(true)} style={{ paddingRight: spacing.s5 }}>
                <Text
                  style={{
                    fontFamily: fonts.sansSemiBold,
                    fontSize: fontSize.label,
                    color: colors.primary,
                  }}
                >
                  {t('tripDetail.viewFullMap')} →
                </Text>
              </Pressable>
            </View>
          </>
        )}
        <MaterialTopTabs
          screenOptions={{
            tabBarScrollEnabled: true,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.secondary300,
            tabBarLabelStyle: {
              fontFamily: fonts.sansSemiBold,
              fontSize: fontSize.sm,
              textTransform: 'none',
            },
            tabBarIndicatorStyle: { backgroundColor: colors.primary, height: 2 },
            tabBarStyle: { backgroundColor: colors.surfaceCream, elevation: 0, shadowOpacity: 0 },
          }}
        >
          <MaterialTopTabs.Screen
            name="itinerary"
            options={{ title: t('tripDetail.tabs.itinerary') }}
          />
          <MaterialTopTabs.Screen name="budget" options={{ title: t('tripDetail.tabs.budget') }} />
          <MaterialTopTabs.Screen
            name="packing"
            options={{ title: t('tripDetail.tabs.packing') }}
          />
          <MaterialTopTabs.Screen name="diary" options={{ title: t('tripDetail.tabs.diary') }} />
        </MaterialTopTabs>

        {showMap && mapOpen ? <FullMapModal visible onClose={() => setMapOpen(false)} /> : null}
      </SafeAreaView>
    </TripDetailProvider>
  );
}

const styles = {
  detailHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
};
