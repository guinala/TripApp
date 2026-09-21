import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadNotice } from '@/components/ui/LoadNotice';
import { RemoteImage } from '@/components/ui/RemoteImage';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useUnsplashCover } from '@/hooks/use-unsplash-photos';
import type { EditorialDestination } from '@/types/destination';
import { colors, fonts } from '@/constants/theme';
import { DESTINATION_TYPE_LABELS } from '@/constants/destinations';

export function DestinationCard({
  destination,
  onPress,
  style,
  featured = false,
}: {
  destination: EditorialDestination;
  onPress: () => void;
  style?: ViewStyle;
  featured?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const { photo, loading, error, retry } = useUnsplashCover(destination.coverQuery);
  const rating =
    destination.editorialRating == null
      ? null
      : new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(
          destination.editorialRating,
        );
  const price = destination.priceRange
    ? { low: '€', mid: '€€', high: '€€€' }[destination.priceRange]
    : null;
  const ratingView = rating && (
    <View style={styles.rating} accessibilityLabel={`${t('destination.stats.rating')}: ${rating}`}>
      <Ionicons
        name="star"
        size={featured ? 16 : 13}
        color={featured ? colors.white : colors.accent}
      />
      <Text style={[styles.ratingText, featured && styles.light]}>{rating}</Text>
    </View>
  );
  return (
    <View style={[styles.shadow, style]}>
      <View style={styles.card}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${destination.name}, ${destination.country}`}
          onPress={onPress}
          style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.85 }]}
        >
          <View style={[styles.picture, featured && styles.featuredPicture]}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : photo ? (
              <RemoteImage
                uri={featured ? photo.regularUrl : photo.smallUrl}
                label={destination.name}
              />
            ) : (
              <Ionicons name="compass-outline" size={40} color={colors.primary700} />
            )}
            {featured && (
              <>
                <LinearGradient
                  pointerEvents="none"
                  colors={['transparent', 'rgba(15,27,51,0.78)']}
                  style={StyleSheet.absoluteFill}
                />
                <View pointerEvents="none" style={styles.featuredBody}>
                  <Text style={styles.featuredName}>{destination.name}</Text>
                  <View style={styles.featuredMeta}>
                    {ratingView}
                    <Text style={styles.featuredTags}>
                      {destination.types
                        .map((type) => t(DESTINATION_TYPE_LABELS[type]))
                        .join(' · ')}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
          {!featured && (
            <View style={styles.body}>
              <View style={styles.row}>
                <Text numberOfLines={1} style={styles.name}>
                  {destination.name}
                </Text>
                {ratingView}
              </View>
              <View style={styles.row}>
                <Text numberOfLines={1} style={styles.country}>
                  {destination.country} · {t(`places.continents.${destination.continent}`)}
                </Text>
                {price && <Text style={styles.price}>{price}</Text>}
              </View>
            </View>
          )}
        </Pressable>
        <LoadNotice error={!!error} onRetry={retry} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  shadow: {
    borderRadius: 16,
    backgroundColor: colors.surfacePaper,
    boxShadow: '0 5px 9px rgba(27,45,79,0.20)',
  },
  card: { flex: 1, borderRadius: 16, backgroundColor: colors.surfacePaper, overflow: 'hidden' },
  picture: {
    aspectRatio: 1.16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  featuredPicture: { aspectRatio: undefined, minHeight: 206 },
  body: { padding: 10, paddingBottom: 12, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  name: { flex: 1, fontFamily: fonts.serifItalic, fontSize: 23, color: colors.secondary },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  ratingText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.secondary },
  country: { flex: 1, fontFamily: fonts.sansRegular, fontSize: 11, color: colors.secondary300 },
  price: { fontFamily: fonts.sansRegular, fontSize: 11, color: colors.secondary300 },
  featuredBody: { position: 'absolute', bottom: 14, left: 14, right: 14, gap: 8 },
  featuredName: { fontFamily: fonts.serifItalic, fontSize: 34, color: colors.white },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  featuredTags: { fontFamily: fonts.sansRegular, fontSize: 12, color: colors.white, flexShrink: 1 },
  light: { color: colors.white },
});
