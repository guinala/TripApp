import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from 'expo-router/js-top-tabs';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { TripDetailProvider } from '@/context/TripDetailContext';
import { useTripStore } from '@/store/tripStore';
import TripMap from '@/components/TripMap';
import DayFilter from '@/components/DayFilter';

// Navegador definido a nivel de módulo (se crea una sola vez)
const { Navigator } = createMaterialTopTabNavigator();
const MaterialTopTabs = withLayoutContext(Navigator);

export default function TripDetailLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useTripStore((s) => s.trips.find((t) => t.id === id));

  if (!trip) {
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
        {/* Cabecera — PLACEHOLDER hasta tener su diseño */}
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

        <TripMap />

        {/* Filtros de día + enlace al mapa completo */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <DayFilter />
          </View>
          <Pressable
            onPress={() => {
              /* TODO 5c: mapa completo */
            }}
            style={{ paddingRight: spacing.s5 }}
          >
            <Text
              style={{
                fontFamily: fonts.sansSemiBold,
                fontSize: fontSize.label,
                color: colors.primary,
              }}
            >
              Ver mapa completo →
            </Text>
          </Pressable>
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
