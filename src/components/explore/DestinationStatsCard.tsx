import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useWeather } from '@/hooks/use-weather';
import { colors, fonts } from '@/constants/theme';
import type { PlaceContent } from '@/types/explore';
import {
  formatPlaceRating,
  MISSING_PLACE_VALUE,
  shouldShowRating,
  shouldShowWeather,
} from '@/utils/place-presentation';

export function DestinationStatsCard({ content }: { content: PlaceContent }) {
  const { t, i18n } = useTranslation();
  const place = content.place;

  const showRating = shouldShowRating(place.types, content.rating);

  const showWeather = shouldShowWeather(place.types, place.location);

  const state = useWeather(
    showWeather ? (place.location?.lat ?? null) : null,
    showWeather ? (place.location?.lng ?? null) : null,
  );

  const cells: {
    key: string;
    label: string;
    value: string;
    hint: string;
    loading?: boolean;
  }[] = [];

  if (showRating) {
    cells.push({
      key: 'rating',
      label: t('destination.stats.rating'),
      value: formatPlaceRating(content.rating, i18n.language),
      hint:
        content.ratingCount == null
          ? MISSING_PLACE_VALUE
          : t('dynamicExplore.reviews', {
              count: content.ratingCount,
              formattedCount: new Intl.NumberFormat(i18n.language).format(content.ratingCount),
            }),
    });
  }

  if (showWeather) {
    cells.push({
      key: 'weather',
      label: t('destination.stats.weather'),
      value: state.weather ? `${Math.round(state.weather.temp)}°C` : MISSING_PLACE_VALUE,
      hint: state.weather?.description ?? MISSING_PLACE_VALUE,
      loading: state.loading,
    });
  }

  if (cells.length === 0) return null;

  return (
    <View style={styles.card}>
      {cells.map((cell, index) => (
        <View key={cell.key} style={[styles.cell, index > 0 && styles.divider]}>
          <Text style={styles.label}>{cell.label.toUpperCase()}</Text>
          {cell.loading ? (
            <ActivityIndicator color={colors.primary} style={{ height: 25 }} />
          ) : (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={[styles.value, cell.key === 'rating' && { color: colors.primary }]}
            >
              {cell.value}
            </Text>
          )}
          <Text numberOfLines={1} style={styles.hint}>
            {cell.hint}
          </Text>
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
