import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius } from '@/constants/theme';
import type { DiaryPhoto } from '@/hooks/use-diary-photos';

// react-native-maps no funciona en web => placeholder
export function DiaryMap({ style }: { photos: DiaryPhoto[]; style?: object }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.wrapper, style]}>
      <Text style={styles.text}>{t('map.unavailableWeb')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontFamily: fonts.sansRegular, color: colors.secondary300 },
});
