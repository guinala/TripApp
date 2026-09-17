import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import type { PlacesError } from '@/services/places';

export function PlacesStatus({
  loading = false,
  error,
  message,
  onRetry,
}: {
  loading?: boolean;
  error?: PlacesError | string | null;
  message?: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  if (!loading && !error && !message) return null;
  const key = error && typeof error !== 'string' ? error.code : null;

  return (
    <View style={styles.box} accessibilityLiveRegion="polite">
      {loading && <ActivityIndicator color={colors.primary700} />}
      <Text style={styles.text}>
        {loading
          ? t('places.searching')
          : key
            ? t(`places.errors.${key}`)
            : error
              ? t('places.genericError')
              : message}
      </Text>
      {onRetry && !loading && (
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.button}>
          <Text style={styles.action}>{t('places.retry')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: spacing.s4,
    gap: spacing.s2,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
  },
  text: { color: colors.secondary, fontFamily: fonts.sansRegular },
  button: { minHeight: 44, justifyContent: 'center' },
  action: { color: colors.primary700, fontFamily: fonts.sansBold },
});
