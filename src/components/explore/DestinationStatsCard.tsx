import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useWeather } from '@/hooks/use-weather';
import { colors, fonts } from '@/constants/theme';
import type { PlaceContent } from '@/types/explore';
import {
  formatPlaceRating,
  MISSING_PLACE_VALUE,
  priceTranslationKey,
} from '@/utils/place-presentation';

export function DestinationStatsCard({ content }: { content: PlaceContent }) {
  const { t, i18n } = useTranslation();
  const location = content.place.location;
  const state = useWeather(location?.lat ?? null, location?.lng ?? null);
  const priceKey = priceTranslationKey(content.priceLevel);
  const ratingCount = content.ratingCount == null
    ? MISSING_PLACE_VALUE
    : t('dynamicExplore.reviews', {
        count: content.ratingCount,
        formattedCount: new Intl.NumberFormat(i18n.language).format(content.ratingCount),
      });
  const cells = [
    {
      label: t('destination.stats.rating'),
      value: formatPlaceRating(content.rating, i18n.language),
      hint: ratingCount,
    },
    {
      label: t('destination.stats.weather'),
      value: state.weather ? `${Math.round(state.weather.temp)}°C` : MISSING_PLACE_VALUE,
      hint: state.weather?.description ?? MISSING_PLACE_VALUE,
      loading: state.loading,
    },
    {
      label: t('destination.stats.cost'),
      value: priceKey ? t(priceKey) : MISSING_PLACE_VALUE,
      hint: priceKey ? t('dynamicExplore.priceHint') : MISSING_PLACE_VALUE,
    },
    {
      label: t('destination.stats.language'),
      value: MISSING_PLACE_VALUE,
      hint: MISSING_PLACE_VALUE,
    },
  ];
  return (
    <View style={styles.card}>
      {cells.map((cell, index) => (
        <View key={cell.label} style={[styles.cell, index > 0 && styles.divider]}>
          <Text style={styles.label}>{cell.label.toUpperCase()}</Text>
          {cell.loading ? (
            <ActivityIndicator color={colors.primary} style={{ height: 25 }} />
          ) : (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={[styles.value, index === 0 && { color: colors.primary }]}
            >
              {cell.value}
            </Text>
          )}
          <Text numberOfLines={1} style={styles.hint}>{cell.hint}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfacePaper,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.secondary100,
    flexDirection: 'row',
    boxShadow: '0 3px 6px rgba(27,45,79,0.15)',
  },
  cell: { flex: 1, alignItems: 'center', paddingHorizontal: 4, gap: 5 },
  divider: { borderLeftWidth: 1, borderLeftColor: colors.surfaceAlt },
  label: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.secondary300 },
  value: { fontFamily: fonts.serifItalic, fontSize: 20, color: colors.secondary },
  hint: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.secondary300,
    textAlign: 'center',
  },
});
