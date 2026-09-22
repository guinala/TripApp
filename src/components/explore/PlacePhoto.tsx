import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RemoteImage } from '@/components/ui/RemoteImage';
import { colors, fonts } from '@/constants/theme';
import { usePlacePhoto } from '@/hooks/use-place-photo';
import type { PlaceLanguage } from '@/types/place';

export function PlacePhoto({
  placeId,
  name,
  localityName,
  countryName,
  size,
  languageCode,
  enabled = true,
  style,
}: {
  placeId: string;
  name: string;
  localityName?: string | null;
  countryName?: string | null;
  size: 'card' | 'hero';
  languageCode: PlaceLanguage;
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTranslation();
  const state = usePlacePhoto({
    placeId,
    name,
    localityName,
    countryName,
    size,
    languageCode,
    enabled,
  });
  return (
    <View style={[styles.root, style]}>
      {state.photo ? (
        <RemoteImage
          uri={state.photo.uri}
          label={name}
          cachePolicy={state.photo.provider === 'google' ? 'none' : 'memory-disk'}
          onImageError={state.reportImageError}
        />
      ) : (
        <View style={styles.placeholder}>
          {state.loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={state.retry}
              style={styles.retry}
            >
              <Text style={styles.placeholderText}>{t('dynamicExplore.photoUnavailable')}</Text>
              <Text style={styles.retryText}>{t('fixes.imageRetry')}</Text>
            </Pressable>
          )}
        </View>
      )}
      {state.photo && state.photo.credits.length > 0 && (
        <View style={styles.creditBand}>
          {state.photo.credits.map((credit, index) => (
            <Pressable
              key={`${credit.name}-${index}`}
              accessibilityRole={credit.uri ? 'link' : undefined}
              disabled={!credit.uri}
              onPress={() => credit.uri && void Linking.openURL(credit.uri)}
            >
              <Text numberOfLines={1} style={styles.creditText}>
                {index === 0 ? t('dynamicExplore.photoCredit', { author: credit.name }) : credit.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  placeholder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  retry: { minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 8 },
  placeholderText: { fontFamily: fonts.sansRegular, color: colors.textSecondary, fontSize: 12 },
  retryText: { fontFamily: fonts.sansSemiBold, color: colors.primary700, fontSize: 12 },
  creditBand: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 5,
    borderRadius: 7,
    backgroundColor: 'rgba(15,27,51,0.72)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexDirection: 'row',
    gap: 5,
  },
  creditText: { fontFamily: fonts.sansRegular, color: colors.white, fontSize: 9, maxWidth: 160 },
});
