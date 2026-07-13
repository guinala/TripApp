import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import { PRICE_META } from '@/constants/destinations';
import { useWeather } from '@/hooks/use-weather';
import { formatRating } from '@/components/explore/DestinationCard';
import type { Destination } from '@/types/destination';

type DestinationStatsCardProps = {
  destination: Destination;
};

function ratingLabelKey(rating: number): string {
  if (rating >= 4.5) return 'destination.rating.outstanding';
  if (rating >= 4) return 'destination.rating.great';
  if (rating >= 3.5) return 'destination.rating.good';
  return 'destination.rating.ok';
}

export function DestinationStatsCard({ destination }: DestinationStatsCardProps) {
  const { t } = useTranslation();
  const { lat, lng } = destination.coordinates;
  const { weather, loading } = useWeather(lat, lng);
  const price = PRICE_META[destination.priceRange];

  return (
    <View style={styles.card}>
      <View style={styles.cell}>
        <Text style={styles.label}>{t('destination.stats.rating').toUpperCase()}</Text>
        <Text style={[styles.value, styles.valuePrimary]}>{formatRating(destination.rating)}</Text>
        <Text style={styles.sublabel} numberOfLines={1}>
          {t(ratingLabelKey(destination.rating))}
        </Text>
      </View>

      <View style={[styles.cell, styles.cellDivider]}>
        <Text style={styles.label}>{t('destination.stats.weather').toUpperCase()}</Text>
        {loading ? (
          <View style={styles.weatherLoading}>
            <ActivityIndicator size="small" color={colors.secondary300} />
          </View>
        ) : (
          <>
            <Text style={styles.value}>{weather ? `${weather.temp}ºC` : '—'}</Text>
            <Text style={styles.sublabel} numberOfLines={1}>
              {weather ? weather.description : t('destination.stats.noData')}
            </Text>
          </>
        )}
      </View>

      <View style={[styles.cell, styles.cellDivider]}>
        <Text style={styles.label}>{t('destination.stats.cost').toUpperCase()}</Text>
        <Text style={styles.value}>{price.symbol}</Text>
        <Text style={styles.sublabel} numberOfLines={1}>
          {t(price.labelKey)}
        </Text>
      </View>

      <View style={[styles.cell, styles.cellDivider]}>
        <Text style={styles.label}>{t('destination.stats.language').toUpperCase()}</Text>
        <Text style={styles.value}>{destination.language.code}</Text>
        <Text style={styles.sublabel} numberOfLines={1}>
          {destination.language.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.surfacePaper,
    borderRadius: radius.xl2,
    borderWidth: 1,
    borderColor: colors.secondary100,
    paddingVertical: 15,
    paddingHorizontal: 25,
    shadowColor: colors.secondary,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  cellDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.surfaceAlt,
  },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.body,
    color: colors.secondary300,
  },
  value: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 0.95 + 3,
    color: colors.textPrimary,
  },
  valuePrimary: {
    color: colors.primary,
  },
  sublabel: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.nano,
    color: colors.secondary300,
  },
  weatherLoading: {
    height: 26,
    justifyContent: 'center',
  },
});
