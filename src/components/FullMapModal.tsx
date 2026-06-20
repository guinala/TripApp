import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { colors, radius, spacing } from '@/constants/theme';
import { useTripDetail } from '@/context/TripDetailContext';

export function FullMapModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { activities, selectedDayId } = useTripDetail();

  const located = useMemo(
    () =>
      activities.filter(
        (a) => a.location != null && (selectedDayId === null || a.dayId === selectedDayId),
      ),
    [activities, selectedDayId],
  );

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
      latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.05),
      longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.05),
    };
  }, [located]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <MapView
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialRegion}
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

        <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.secondary} />
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceCream },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s3,
    alignItems: 'flex-start',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfacePaper,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
