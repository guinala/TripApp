import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useWeather } from '@/hooks/use-weather';
import { colors, fonts } from '@/constants/theme';
import type { LatLng } from '@/types/place';
import type { EditorialDestination } from '@/types/destination';

export function DestinationStatsCard({
  location,
  editorial,
}: {
  location: LatLng | null;
  editorial?: EditorialDestination;
}) {
  const { t, i18n } = useTranslation();
  const state = useWeather(location?.lat ?? null, location?.lng ?? null);
  const rating = editorial?.editorialRating;
  const price = editorial?.priceRange;
  const noData = t('destination.stats.noData');
  const cells = [
    {
      label: t('destination.stats.rating'),
      value:
        rating != null
          ? new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(rating)
          : '—',
      hint:
        rating == null
          ? noData
          : t(
              `destination.rating.${rating >= 4.8 ? 'outstanding' : rating >= 4.5 ? 'great' : rating >= 4 ? 'good' : 'ok'}`,
            ),
    },
    {
      label: t('destination.stats.weather'),
      value: state.weather ? `${Math.round(state.weather.temp)}°C` : '—',
      hint: state.weather?.description ?? noData,
      loading: state.loading,
    },
    {
      label: t('destination.stats.cost'),
      value: price ? { low: '€', mid: '€€', high: '€€€' }[price] : '—',
      hint: price ? t(`destination.price.${price}`) : noData,
    },
    {
      label: t('destination.stats.language'),
      value: editorial?.language?.code ?? '—',
      hint: editorial?.language?.label ?? noData,
    },
  ];
  return (
    <View>
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
                minimumFontScale={0.75}
                style={[styles.value, index === 0 && { color: colors.primary }]}
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
    fontSize: 12,
    lineHeight: 16,
    color: colors.secondary300,
    textAlign: 'center',
  },
});
