import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { RemoteImage } from '@/components/ui/RemoteImage';
import { colors, fonts } from '@/constants/theme';
import type { usePlacePhoto } from '@/hooks/use-place-photo';

export function PlacePhoto({
  state,
  name,
  style,
}: {
  state: ReturnType<typeof usePlacePhoto>;
  name: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTranslation();

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
            <Pressable accessibilityRole="button" onPress={state.retry} style={styles.retry}>
              <Text style={styles.placeholderText}>{t('dynamicExplore.photoUnavailable')}</Text>
              <Text style={styles.retryText}>{t('fixes.imageRetry')}</Text>
            </Pressable>
          )}
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
});
