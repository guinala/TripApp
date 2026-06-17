import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialTopTabs } from './_top-tabs';

export default function TripDetailLayout() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontSize: 16 }}>‹ Volver</Text>
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '600', marginTop: 8 }}>Detalle del viaje</Text>
      </View>

      <View
        style={{
          height: 200,
          backgroundColor: '#e9e9ef',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#888' }}>Mapa (paso 5)</Text>
      </View>

      <MaterialTopTabs
        screenOptions={{
          tabBarLabelStyle: { fontSize: 13, fontWeight: '600', textTransform: 'none' },
          tabBarIndicatorStyle: { height: 2 },
        }}
      >
        <MaterialTopTabs.Screen name="itinerary" options={{ title: 'Itinerario' }} />
        <MaterialTopTabs.Screen name="budget" options={{ title: 'Presupuesto' }} />
        <MaterialTopTabs.Screen name="packing" options={{ title: 'Equipaje' }} />
        <MaterialTopTabs.Screen name="diary" options={{ title: 'Diario' }} />
      </MaterialTopTabs>
    </SafeAreaView>
  );
}
