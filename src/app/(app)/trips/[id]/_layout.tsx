import { TripHeader } from "@/components/TripHeader";
import { TripMap } from "@/components/TripMap";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { MaterialTopTabs } from "./_top-tabs";

export default function TripDetailLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1 }}>
      <TripHeader tripId={id} />
      <TripMap tripId={id} />
      <MaterialTopTabs>
        <MaterialTopTabs.Screen
          name="itinerary"
          options={{ title: "Itinerario" }}
        />
        <MaterialTopTabs.Screen
          name="budget"
          options={{ title: "Presupuesto" }}
        />
        <MaterialTopTabs.Screen
          name="packing"
          options={{ title: "Equipaje" }}
        />
        <MaterialTopTabs.Screen name="diary" options={{ title: "Diario" }} />
      </MaterialTopTabs>
    </View>
  );
}
