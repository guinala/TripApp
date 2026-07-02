import { useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { colors, radius } from '@/constants/theme';
import { regionForPoints } from '@/utils/mapRegion';
import type { DiaryPhoto } from '@/hooks/use-diary-photos';

const THUMB_SIZE = 44;

type DiaryMapProps = {
  photos: DiaryPhoto[];
  onPressPhoto?: (photo: DiaryPhoto) => void;
  style?: object;
};

// Marker individual: trackea cambios (necesario en Android para que la
// imagen remota se capture como bitmap nativo) solo hasta que la imagen
// termina de cargar, luego lo desactiva. Evita el coste de CPU de dejarlo
// activo permanentemente con muchos pines.
function PhotoMarker({
  photo,
  onPress,
}: {
  photo: DiaryPhoto;
  onPress?: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Marker
      coordinate={{ latitude: photo.location!.lat, longitude: photo.location!.lng }}
      onPress={onPress}
      tracksViewChanges={!loaded}
    >
      <View style={styles.pin}>
        {photo.url ? (
          <Image
            source={{ uri: photo.url }}
            style={styles.thumb}
            onLoadEnd={() => setLoaded(true)}
          />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]} />
        )}
      </View>
    </Marker>
  );
}

export function DiaryMap({ photos, onPressPhoto, style }: DiaryMapProps) {
  const located = useMemo(() => photos.filter((p) => p.location != null), [photos]);

  const initialRegion = useMemo(
    () => regionForPoints(located.map((p) => p.location!)),
    [located],
  );

  return (
    <View style={[styles.wrapper, style]}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        toolbarEnabled={false}
      >
        {located.map((photo) => (
          <PhotoMarker key={photo.id} photo={photo} onPress={() => onPressPhoto?.(photo)} />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: radius.lg, overflow: 'hidden' },
  map: { flex: 1 },
  pin: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2.5,
    borderColor: colors.surfacePaper,
    backgroundColor: colors.surfacePaper,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
    overflow: 'hidden',
  },
  thumb: { width: '100%', height: '100%' },
  thumbPlaceholder: { backgroundColor: colors.surfaceAlt },
});
