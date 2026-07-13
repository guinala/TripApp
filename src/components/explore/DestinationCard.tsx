import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { PRICE_META } from '@/constants/destinations';
import { useUnsplashCover } from '@/hooks/use-unsplash-photos';
import i18n from '@/i18n';
import type { Destination } from '@/types/destination';

type DestinationCardProps = {
  destination: Destination;
  onPress: () => void;
  style?: ViewStyle;
};

export function formatRating(rating: number): string {
  const text = rating.toFixed(1);
  return i18n.language === 'es' ? text.replace('.', ',') : text;
}

export function DestinationCard({ destination, onPress, style }: DestinationCardProps) {
  const { photo } = useUnsplashCover(destination.coverQuery);
  const price = PRICE_META[destination.priceRange];

  return (
    <Pressable onPress={onPress} style={[styles.card, style]}>
      <View style={styles.imageWrapper}>
        {photo && (
          <Image
            source={{ uri: photo.smallUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {destination.name}
          </Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color={colors.accent} />
            <Text style={styles.ratingText}>{formatRating(destination.rating)}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.meta} numberOfLines={1}>
            {destination.country} · {destination.continent}
          </Text>
          <Text style={styles.price}>{price.symbol}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfacePaper,
    overflow: 'hidden',
  },
  imageWrapper: {
    height: 120.5,
    backgroundColor: colors.surfaceAlt,
  },
  info: {
    padding: 10,
    gap: spacing.s1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
  },
  name: {
    flex: 1,
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.title,
    color: colors.textPrimary,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s1,
  },
  ratingText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.label,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
  },
  meta: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.nano,
    color: colors.secondary300,
  },
  price: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.nano,
    color: colors.secondary300,
  },
});
