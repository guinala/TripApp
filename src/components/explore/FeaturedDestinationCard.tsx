import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { DESTINATION_TYPE_LABELS } from '@/constants/destinations';
import { useUnsplashCover } from '@/hooks/use-unsplash-photos';
import { formatRating } from '@/components/explore/DestinationCard';
import type { Destination } from '@/types/destination';

type FeaturedDestinationCardProps = {
  destination: Destination;
  onPress: () => void;
};

export function FeaturedDestinationCard({ destination, onPress }: FeaturedDestinationCardProps) {
  const { photo } = useUnsplashCover(destination.coverQuery);
  const typesLabel = destination.types.map((t) => DESTINATION_TYPE_LABELS[t]).join(' · ');

  return (
    <Pressable onPress={onPress} style={styles.card}>
      {photo && (
        <Image
          source={{ uri: photo.regularUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={250}
        />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.33)', 'rgba(0,0,0,0.55)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.badge}>
        <Ionicons name="star" size={12} color={colors.secondary} />
        <Text style={styles.badgeText}>Destacado</Text>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.meta}>
          {destination.continent} · {destination.country}
        </Text>
        <Text style={styles.name}>{destination.name}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="star" size={12} color={colors.white} />
          <Text style={styles.infoText}>{formatRating(destination.rating)}</Text>
          <Text style={styles.infoText}>·</Text>
          <Text style={styles.infoText} numberOfLines={1}>
            {typesLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 150,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
    padding: 10,
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s1,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.secondary,
  },
  bottom: {
    gap: 2,
  },
  meta: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.label,
    color: colors.white,
  },
  name: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.textSm,
    color: colors.white,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s1,
  },
  infoText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.label,
    color: colors.white,
  },
});
