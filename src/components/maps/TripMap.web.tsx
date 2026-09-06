import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, spacing } from '@/constants/theme';

// react-native-maps no funciona en web => placeholder
export default function TripMap() {
  const { t } = useTranslation();
  return (
    <View style={styles.wrapper}>
      <Text style={styles.text}>{t('map.unavailableWeb')}</Text>
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
