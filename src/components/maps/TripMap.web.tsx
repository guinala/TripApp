import { useState } from 'react';
import { View } from 'react-native';
import { useTripDetail } from '@/context/TripDetailContext';
import { PlacesButton } from '@/components/explore/PlacesUI';
import { PlacesAttribution } from '@/components/explore/PlacesAttribution';
import { PlaceMapStatus } from './PlaceMapStatus';
import { EmbedMap } from './EmbedMap.web';

export default function TripMap() {
  const { trip, mapActivities, destinationResolution, mapAttributions } = useTripDetail();
  const [selected, setSelected] = useState<string | null>(null);
  const activity = mapActivities.find((item) => item.id === selected);
  const place = destinationResolution.place;
  return (
    <View style={{ paddingHorizontal: 16, gap: 12 }}>
      <EmbedMap
        title={activity?.title ?? place?.name ?? trip.title}
        placeId={activity?.placeId ?? (!activity ? trip.destinationPlaceId : null)}
        location={activity?.location ?? (!activity ? place?.location : null)}
      />
      <View style={{ gap: 8, flexDirection: 'row', flexWrap: 'wrap' }}>
        <PlacesButton secondary={!selected} title={trip.title} onPress={() => setSelected(null)} />
        {mapActivities.map((item) => (
          <PlacesButton
            key={item.id}
            title={item.title}
            secondary={selected !== item.id}
            onPress={() => setSelected(item.id)}
          />
        ))}
      </View>
      <PlaceMapStatus compact />
      <PlacesAttribution attributions={mapAttributions} />
    </View>
  );
}
