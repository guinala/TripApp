import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import type { LatLng, MapRegion } from '@/utils/mapRegion';

type LocationPickerModalProps = {
  visible: boolean;
  initialLocation: LatLng | null;
  fallbackRegion?: MapRegion;
  resetKey?: string; // fuerza remount del mapa al cambiar de foto
  onClose: () => void;
  onConfirm: (location: LatLng | null) => void; // null = quitar ubicación
};

const DEFAULT_DELTA = 0.02;

export function LocationPickerModal({
  visible,
  initialLocation,
  fallbackRegion,
  resetKey,
  onClose,
  onConfirm,
}: LocationPickerModalProps) {
  const mapRef = useRef<MapView>(null);
  const [picked, setPicked] = useState<LatLng | null>(initialLocation);
  const [locating, setLocating] = useState(false);

  // Al reabrir el modal para otra foto, partimos de su ubicación actual
  useEffect(() => {
    if (visible) setPicked(initialLocation);
  }, [visible, initialLocation]);

  const handleMapPress = useCallback(
    (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      setPicked({ lat: latitude, lng: longitude });
    },
    [],
  );

  const handleUseCurrentLocation = useCallback(async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso necesario', 'Activa el acceso a tu ubicación para usar esta opción.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const next: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setPicked(next);
      mapRef.current?.animateToRegion(
        {
          latitude: next.lat,
          longitude: next.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500,
      );
    } catch {
      Alert.alert('No se pudo obtener tu ubicación', 'Inténtalo de nuevo.');
    } finally {
      setLocating(false);
    }
  }, []);

  const initialRegion: MapRegion | undefined = initialLocation
    ? {
        latitude: initialLocation.lat,
        longitude: initialLocation.lng,
        latitudeDelta: DEFAULT_DELTA,
        longitudeDelta: DEFAULT_DELTA,
      }
    : fallbackRegion;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <MapView
          key={resetKey}
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          onPress={handleMapPress}
        >
          {picked ? (
            <Marker
              coordinate={{ latitude: picked.lat, longitude: picked.lng }}
              pinColor={colors.primary}
            />
          ) : null}
        </MapView>

        <SafeAreaView style={styles.topBar} edges={['top']} pointerEvents="box-none">
          <Pressable style={styles.iconBtn} onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.secondary} />
          </Pressable>
          <Text style={styles.title}>Ubicación de la foto</Text>
          <View style={styles.iconBtnSpacer} />
        </SafeAreaView>

        <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
          <Pressable
            style={styles.currentLocationBtn}
            onPress={handleUseCurrentLocation}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="locate" size={18} color={colors.primary} />
            )}
            <Text style={styles.currentLocationText}>Usar mi ubicación actual</Text>
          </Pressable>

          <Text style={styles.hint}>O toca el mapa para colocar el pin manualmente</Text>

          <View style={styles.actions}>
            {initialLocation ? (
              <Pressable style={[styles.actionBtn, styles.removeBtn]} onPress={() => onConfirm(null)}>
                <Text style={styles.removeText}>Quitar ubicación</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.actionBtn, styles.confirmBtn, !picked && styles.confirmDisabled]}
              onPress={() => picked && onConfirm(picked)}
              disabled={!picked}
            >
              <Text style={styles.confirmText}>Guardar</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceCream },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s3,
  },
  title: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.secondary },
  iconBtn: {
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
  iconBtnSpacer: { width: 40 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surfacePaper,
    borderTopLeftRadius: radius.xl2,
    borderTopRightRadius: radius.xl2,
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s4,
    gap: spacing.s2,
  },
  currentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s2,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.s3,
  },
  currentLocationText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.primary },
  hint: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.sm,
    color: colors.secondary300,
    textAlign: 'center',
  },
  actions: { flexDirection: 'row', gap: spacing.s3, paddingVertical: spacing.s3 },
  actionBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.s4,
    alignItems: 'center',
  },
  removeBtn: { backgroundColor: colors.surfaceAlt },
  removeText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.danger },
  confirmBtn: { backgroundColor: colors.primary },
  confirmDisabled: { opacity: 0.4 },
  confirmText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.white },
});
