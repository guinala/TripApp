import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { TripDetailProvider } from '@/context/TripDetailContext';
import { useTripStore } from '@/store/tripStore';
import { MaterialTopTabs } from './_top-tabs';

export default function TripDetailLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useTripStore((s) => s.trips.find((t) => t.id === id));

  if (!trip) {
    // Caso normal: vienes de la lista, así que el viaje ya está en el store.
    // Pendiente: fallback con un getTripById(id) para deep links.
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfaceCream,
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <TripDetailProvider trip={trip}>
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.surfaceCream }}>
        <View style={{ paddingHorizontal: spacing.s5, paddingVertical: spacing.s3 }}>
          <Pressable onPress={() => router.back()}>
            <Text
              style={{
                fontFamily: fonts.sansRegular,
                fontSize: fontSize.input,
                color: colors.secondary,
              }}
            >
              ‹ Volver
            </Text>
          </Pressable>
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

        <View
          style={{
            height: 180,
            backgroundColor: colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: fonts.sansRegular, color: colors.secondary300 }}>
            Mapa (paso 5)
          </Text>
        </View>

        <MaterialTopTabs
          screenOptions={{
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
          <MaterialTopTabs.Screen name="itinerary" options={{ title: 'Itinerario' }} />
          <MaterialTopTabs.Screen name="budget" options={{ title: 'Presupuesto' }} />
          <MaterialTopTabs.Screen name="packing" options={{ title: 'Equipaje' }} />
          <MaterialTopTabs.Screen name="diary" options={{ title: 'Diario' }} />
        </MaterialTopTabs>
      </SafeAreaView>
    </TripDetailProvider>
  );
}
