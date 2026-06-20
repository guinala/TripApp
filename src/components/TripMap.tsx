import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { colors, radius, spacing } from '@/constants/theme';
import { useTripDetail } from '@/context/TripDetailContext';

export default function TripMap() {
  const { activities, selectedDayId } = useTripDetail();

  const located = useMemo(
    () =>
      activities.filter(
        (a) => a.location != null && (selectedDayId === null || a.dayId === selectedDayId),
      ),
    [activities, selectedDayId],
  );

  // Región inicial que encuadra todos los pines (con margen)
  const initialRegion = useMemo(() => {
    if (located.length === 0) return undefined;
    const lats = located.map((a) => a.location!.lat);
    const lngs = located.map((a) => a.location!.lng);
    const minLat = Math.min(...lats),
      maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs),
      maxLng = Math.max(...lngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.4, 0.02),
      longitudeDelta: Math.max((maxLng - minLng) * 1.4, 0.02),
    };
  }, [located]);

  return (
    <View style={styles.wrapper}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        toolbarEnabled={false}
      >
        {located.map((a) => (
          <Marker
            key={a.id}
            coordinate={{ latitude: a.location!.lat, longitude: a.location!.lng }}
            title={a.title}
            description={a.address ?? undefined}
            pinColor={colors.primary}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.s5,
    height: 160,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  map: { flex: 1 },
});
