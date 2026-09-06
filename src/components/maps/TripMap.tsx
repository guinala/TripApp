import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { colors, radius, spacing } from '@/constants/theme';
import { useTripDetail } from '@/context/TripDetailContext';
import { isValidCoordinate, destinationCoordinates } from '@/utils/mapRegion';

import type { Activity } from '@/types/activity';

const DEFAULT_LOCATION = { lat: 40.416775, lng: -3.70379 };

function activityTimestamp(
  activity: Activity,
  days: ReturnType<typeof useTripDetail>['days'],
): number {
  const day = days.find((item) => item.id === activity.dayId);
  if (!day) return Number.POSITIVE_INFINITY;
  const time = activity.time ?? '00:00';
  return new Date(`${day.date}T${time}:00`).getTime();
}

export default function TripMap() {
  const { trip, days, activities, selectedDayId } = useTripDetail();
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);

  const fallbackLocation = useMemo(() => {
    return destinationCoordinates(trip.destination) ?? DEFAULT_LOCATION;
  }, [trip.destination]);

  const located = useMemo(
    () =>
      activities.filter(
        (a) =>
          isValidCoordinate(a.location) && (selectedDayId === null || a.dayId === selectedDayId),
      ),
    [activities, selectedDayId],
  );

  const focusActivity = useMemo(() => {
    if (located.length === 0) return null;
    const ordered = [...located].sort(
      (a, b) => activityTimestamp(a, days) - activityTimestamp(b, days),
    );
    return ordered[0];
  }, [days, located]);

  // Región inicial que encuadra todos los pines (con margen)
  const initialRegion = useMemo(() => {
    if (located.length === 0) {
      return {
        latitude: fallbackLocation.lat,
        longitude: fallbackLocation.lng,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }
    if (located.length === 1 || focusActivity) {
      const point = focusActivity?.location ?? located[0].location!;
      return {
        latitude: point.lat,
        longitude: point.lng,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
    }
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
  }, [fallbackLocation, focusActivity, located]);

  useEffect(() => {
    if (!mapReady) return;
    const timeout = setTimeout(() => {
      const region = initialRegion;
      if (located.length === 1 || focusActivity) {
        mapRef.current?.animateCamera(
          { center: { latitude: region.latitude, longitude: region.longitude }, zoom: 14 },
          { duration: 300 },
        );
      } else {
        mapRef.current?.animateToRegion(region, 300);
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [focusActivity, initialRegion, located.length, mapReady]);

  return (
    <View style={styles.wrapper}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        onMapReady={() => setMapReady(true)}
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
