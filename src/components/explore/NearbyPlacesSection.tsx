import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import type { InterestCategory, LatLng, PlaceSummary } from '@/types/place';
import { colors, fonts } from '@/constants/theme';
import { usePlaceLanguage } from '@/hooks/use-place-details';
import { useNearbyPlaces } from '@/hooks/use-nearby-places';
import { useUnsplashCover } from '@/hooks/use-unsplash-photos';
import { RemoteImage } from '@/components/ui/RemoteImage';
import { PlacesStatus } from './PlacesStatus';
import { PlacesAttribution } from './PlacesAttribution';

function NearbyCard({ place, cityName }: { place: PlaceSummary; cityName: string }) {
  const cover = useUnsplashCover(`${place.name} ${cityName}`);
  return (
    <Pressable
      accessibilityRole="button"
      style={styles.card}
      onPress={() =>
        router.push({ pathname: '/places/[placeId]', params: { placeId: place.placeId } })
      }
    >
      <View style={styles.image}>
        {cover.photo ? (
          <RemoteImage uri={cover.photo.smallUrl} label={place.name} />
        ) : cover.loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Ionicons name="location-outline" size={34} color={colors.primary} />
        )}
      </View>
      <View style={styles.cardBody}>
        <Text numberOfLines={2} style={styles.cardTitle}>
          {place.name}
        </Text>
        <Text numberOfLines={2} style={styles.address}>
          {place.address}
        </Text>
        <PlacesAttribution attributions={place.attributions} />
      </View>
    </Pressable>
  );
}
export function NearbyPlacesSection({ center, cityName }: { center: LatLng; cityName: string }) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<InterestCategory>('visit');
  const state = useNearbyPlaces(center, category, usePlaceLanguage(), true);
  return (
    <View style={{ gap: 14 }}>
      <Text style={styles.heading}>{t('destination.highlights')}</Text>
      <Text style={styles.scope}>{t('placesUI.nearbyScope')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {(['visit', 'museum', 'park', 'restaurant'] as const).map((value) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: value === category }}
            key={value}
            onPress={() => setCategory(value)}
            style={[styles.chip, value === category && styles.activeChip]}
          >
            <Text style={[styles.chipText, value === category && { color: colors.white }]}>
              {t(`places.categories.${value}`)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {(state.loading || state.error || !state.places.length) && (
        <View style={{ paddingHorizontal: 25 }}>
          <PlacesStatus
            loading={state.loading}
            error={state.error}
            message={
              !state.loading && !state.error && !state.places.length
                ? t('places.noResults')
                : undefined
            }
            onRetry={state.error ? state.retry : undefined}
          />
        </View>
      )}
      <FlatList
        horizontal
        data={state.places}
        keyExtractor={(place) => place.placeId}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cards}
        initialNumToRender={3}
        windowSize={3}
        renderItem={({ item }) => <NearbyCard place={item} cityName={cityName} />}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  heading: {
    fontFamily: fonts.serifItalic,
    fontSize: 32,
    color: colors.secondary,
    paddingHorizontal: 25,
  },
  scope: {
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    color: colors.textSecondary,
    paddingHorizontal: 25,
  },
  categories: { paddingHorizontal: 25, gap: 8 },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.secondary100,
  },
  activeChip: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  chipText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.secondary },
  cards: { paddingHorizontal: 25, gap: 12, paddingBottom: 4 },
  card: { width: 190, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surfacePaper },
  image: {
    height: 165,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: 12, gap: 6 },
  cardTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.secondary },
  address: {
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.secondary300,
  },
});
