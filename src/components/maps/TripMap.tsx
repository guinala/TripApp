import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTripDetail } from '@/context/TripDetailContext';
import { itineraryRegion, isValidCoordinate } from '@/utils/mapRegion';
import { PlaceMapStatus } from './place-map-status';
import { PlacesAttribution } from '@/components/explore/places-attribution';
import { colors } from '@/constants/theme';

export default function TripMap() {
  const { mapActivities, destinationResolution, mapAttributions } = useTripDetail();
  const located = useMemo(
    () => mapActivities.filter((a) => isValidCoordinate(a.location)),
    [mapActivities],
  );

  const region = useMemo(
    () =>
      itineraryRegion(
        located.map((a) => a.location!),
        destinationResolution.place,
      ),
    [located, destinationResolution.place],
  );

  const ref = useRef<MapView>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready && region) ref.current?.animateToRegion(region, 300);
  }, [ready, region]);

  return (
    <View style={{ marginHorizontal: 20, gap: 6 }}>
      {region ? (
        <View style={{ height: 160, borderRadius: 16, overflow: 'hidden' }}>
          <MapView
            ref={ref}
            style={{ flex: 1 }}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            onMapReady={() => setReady(true)}
            toolbarEnabled={false}
          >
            {located.map((a) => (
              <Marker
                key={a.id}
                coordinate={{ latitude: a.location!.lat, longitude: a.location!.lng }}
                title={a.title}
                description={a.address ?? undefined}
                pinColor={colors.primary700}
              />
            ))}
          </MapView>
        </View>
      ) : null}
      <PlaceMapStatus compact={!!region} />
      {!!region && <PlacesAttribution attributions={mapAttributions} />}
    </View>
  );
}
