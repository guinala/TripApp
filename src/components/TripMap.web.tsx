import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '@/constants/theme';

// react-native-maps no funciona en web => placeholder
export function TripMap() {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.text}>Mapa no disponible en web</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.s5,
    height: 160,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontFamily: fonts.sansRegular, color: colors.secondary300 },
});
