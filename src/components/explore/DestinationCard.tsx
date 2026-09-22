import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PlacePhoto } from '@/components/explore/PlacePhoto';
import { colors, fonts } from '@/constants/theme';
import { usePlaceLanguage } from '@/hooks/use-place-details';
import type { ExplorePlace } from '@/types/explore';
import {
  formatPlaceRating,
  MISSING_PLACE_VALUE,
  priceTranslationKey,
} from '@/utils/place-presentation';

function categoryKey(place: ExplorePlace): string | null {
  if (place.types.includes('restaurant')) return 'restaurant';
  if (place.types.includes('museum')) return 'museum';
  if (place.types.includes('park')) return 'park';
  if (place.types.includes('tourist_attraction')) return 'visit';
  return null;
}

export function DestinationCard({
  place,
  onPress,
  style,
  featured = false,
  photoEnabled = true,
}: {
  place: ExplorePlace;
  onPress: () => void;
  style?: ViewStyle;
  featured?: boolean;
  photoEnabled?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const languageCode = usePlaceLanguage();
  const rating = formatPlaceRating(place.rating, i18n.language);
  const priceKey = priceTranslationKey(place.priceLevel);
  const price = priceKey ? t(priceKey) : MISSING_PLACE_VALUE;
  const category = categoryKey(place);
  const ratingView = (
    <View
      style={styles.rating}
      accessibilityLabel={
        place.rating == null
          ? t('dynamicExplore.ratingUnavailable')
          : `${t('destination.stats.rating')}: ${rating}`
      }
    >
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
          accessibilityLabel={`${place.name}, ${place.countryName ?? MISSING_PLACE_VALUE}`}
          onPress={onPress}
          style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.85 }]}
        >
          <View style={[styles.picture, featured && styles.featuredPicture]}>
            <PlacePhoto
              placeId={place.placeId}
              name={place.name}
              localityName={place.localityName}
              countryName={place.countryName}
              size={featured ? 'hero' : 'card'}
              languageCode={languageCode}
              enabled={photoEnabled}
              style={StyleSheet.absoluteFill}
            />
            {featured && (
              <>
                <LinearGradient
                  pointerEvents="none"
                  colors={['transparent', 'rgba(15,27,51,0.78)']}
                  style={StyleSheet.absoluteFill}
                />
                <View pointerEvents="none" style={styles.featuredBody}>
                  <Text numberOfLines={1} style={styles.featuredName}>{place.name}</Text>
                  <View style={styles.featuredMeta}>
                    {ratingView}
                    <Text numberOfLines={1} style={styles.featuredTags}>
                      {category ? t(`places.categories.${category}`) : MISSING_PLACE_VALUE}
                      {' · '}
                      {place.countryName ?? MISSING_PLACE_VALUE}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
          {!featured && (
            <View style={styles.body}>
              <View style={styles.row}>
                <Text numberOfLines={1} style={styles.name}>{place.name}</Text>
                {ratingView}
              </View>
              <View style={styles.row}>
                <Text numberOfLines={1} style={styles.country}>
                  {place.countryName ?? MISSING_PLACE_VALUE}
                  {' · '}
                  {category ? t(`places.categories.${category}`) : MISSING_PLACE_VALUE}
                </Text>
                <Text numberOfLines={1} adjustsFontSizeToFit style={styles.price}>{price}</Text>
              </View>
            </View>
          )}
        </Pressable>
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
  price: { maxWidth: '42%', fontFamily: fonts.sansRegular, fontSize: 11, color: colors.secondary300 },
  featuredBody: { position: 'absolute', bottom: 28, left: 14, right: 14, gap: 8 },
  featuredName: { fontFamily: fonts.serifItalic, fontSize: 34, color: colors.white },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  featuredTags: { fontFamily: fonts.sansRegular, fontSize: 12, color: colors.white, flexShrink: 1 },
  light: { color: colors.white },
});
