import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { getDestination } from '@/constants/destinations';
import { DestinationStatsCard } from '@/components/explore/DestinationStatsCard';
import { HighlightCard } from '@/components/explore/HighlightCard';
import { useUnsplashCover } from '@/hooks/use-unsplash-photos';

const HERO_HEIGHT = 314;
const STATS_OVERLAP = -59;

export default function DestinationDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const destination = id ? getDestination(id) : undefined;
  const { photo } = useUnsplashCover(destination?.coverQuery ?? null);

  if (!destination) {
    return <Redirect href="/(app)/(tabs)/explore" />;
  }

  const handleShare = () => {
    Share.share({
      message: `Echa un vistazo a ${destination.name}, ${destination.country} ✈️`,
    });
  };

  const handleAddToTrip = () => {
    router.push({
      pathname: '/trips/new',
      params: { destination: `${destination.name}, ${destination.country}` },
    });
  };

  const footerHeight = 54 + spacing.s3 * 2 + insets.bottom;

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: footerHeight + spacing.s5 }}
      >
        <View style={styles.hero}>
          {photo && (
            <Image
              source={{ uri: photo.regularUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={250}
            />
          )}
          <LinearGradient
            colors={['rgba(5,5,5,0.1)', 'rgba(0,0,0,0.45)']}
            style={StyleSheet.absoluteFill}
          />

          <View style={[styles.heroIcons, { paddingTop: insets.top + spacing.s2 }]}>
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Ionicons name="chevron-back" size={32} color={colors.white} />
            </Pressable>
            <Pressable onPress={handleShare} hitSlop={10}>
              <Ionicons name="share-outline" size={28} color={colors.white} />
            </Pressable>
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.heroPlace}>
              {destination.continent} · {destination.country}
            </Text>
            <Text style={styles.heroTitle}>{destination.name}</Text>
          </View>
        </View>

        <View style={styles.statsWrapper}>
          <DestinationStatsCard destination={destination} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Sobre <Text style={styles.sectionTitleAccent}>{destination.name}</Text>
          </Text>
          <Text style={styles.description}>{destination.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.sectionTitlePadded]}>Imprescindibles</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.highlightsRow}
          >
            {destination.highlights.map((h) => (
              <HighlightCard key={h.name} highlight={h} />
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.s3 }]}>
        <Pressable style={styles.addButton} onPress={handleAddToTrip}>
          <Text style={styles.addButtonText}>+ Añadir a un viaje</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceCream,
  },
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'space-between',
  },
  heroIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  heroInfo: {
    paddingHorizontal: 20,
    paddingVertical: 23,
    gap: 10,
  },
  heroPlace: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 0.95 + 2,
    color: colors.white,
  },
  heroTitle: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.textMd,
    lineHeight: fontSize.textMd * 0.95 + 4,
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.69)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  statsWrapper: {
    marginTop: STATS_OVERLAP,
    paddingHorizontal: 21,
  },
  section: {
    marginTop: spacing.s8,
    gap: 10,
  },
  sectionTitle: {
    paddingHorizontal: 25,
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.textSm,
    lineHeight: fontSize.textSm * 0.95 + 4,
    color: colors.textPrimary,
  },
  sectionTitleAccent: {
    color: colors.primary,
  },
  sectionTitlePadded: {
    paddingHorizontal: 25,
  },
  description: {
    paddingHorizontal: 25,
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.5,
    color: colors.secondary300,
  },
  highlightsRow: {
    paddingHorizontal: 25,
    gap: 10,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 25,
    paddingTop: spacing.s3,
    backgroundColor: colors.surfaceCream,
  },
  addButton: {
    height: 54,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 2,
    elevation: 4,
  },
  addButtonText: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 16,
    color: colors.primary50,
  },
});
