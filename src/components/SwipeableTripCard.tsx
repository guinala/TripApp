import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTripStore } from '@/store/tripStore';
import { TripCard } from './cards/TripCard';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import type { Trip } from '@/types/trip';

export function SwipeableTripCard({ trip }: { trip: Trip }) {
  const removeTrip = useTripStore((s) => s.removeTrip);

  const confirm = () => {
    Alert.alert('Eliminar viaje', '¿Seguro? Se borrará todo su contenido.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => removeTrip(trip.id).catch(() => {}),
      },
    ]);
  };

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      renderRightActions={() => (
        <Pressable style={styles.action} onPress={confirm}>
          <Ionicons name="trash-outline" size={22} color={colors.surfacePaper} />
          <Text style={styles.label}>Eliminar</Text>
        </Pressable>
      )}
    >
      <TripCard trip={trip} />
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  action: {
    width: 90,
    marginLeft: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: { fontFamily: fonts.sansBold, fontSize: fontSize.label, color: colors.surfacePaper },
});
