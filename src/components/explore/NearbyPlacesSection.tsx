import { useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import type { InterestCategory, LatLng, PlaceLanguage } from '@/types/place';
import type { ExplorePlace } from '@/types/explore';
import { colors, fonts } from '@/constants/theme';
import { usePlaceLanguage } from '@/hooks/use-place-details';
import { useNearbyPlaces } from '@/hooks/use-nearby-places';
import { PlacePhoto } from '@/components/explore/PlacePhoto';
import { formatPlaceRating, MISSING_PLACE_VALUE } from '@/utils/place-presentation';
import { PlacesStatus } from './PlacesStatus';
import { PlacesAttribution } from './PlacesAttribution';

function NearbyCard({
  place,
  cityName,
  languageCode,
  photoEnabled,
}: {
  place: ExplorePlace;
  cityName: string;
  languageCode: PlaceLanguage;
  photoEnabled: boolean;
}) {
  const { i18n } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      style={styles.card}
      onPress={() =>
        router.push({ pathname: '/places/[placeId]', params: { placeId: place.placeId } })
      }
    >
      <View style={styles.image}>
        <PlacePhoto
          placeId={place.placeId}
          name={place.name}
          localityName={place.localityName ?? cityName}
          countryName={place.countryName}
          size="card"
          languageCode={languageCode}
          enabled={photoEnabled}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text numberOfLines={2} style={styles.cardTitle}>{place.name}</Text>
          <Text style={styles.rating}>{formatPlaceRating(place.rating, i18n.language)}</Text>
        </View>
        <Text numberOfLines={2} style={styles.address}>
          {place.address ?? MISSING_PLACE_VALUE}
        </Text>
        <PlacesAttribution attributions={place.attributions} />
      </View>
    </Pressable>
  );
}

export function NearbyPlacesSection({
  center,
  cityName,
  enabled = true,
}: {
  center: LatLng;
  cityName: string;
  enabled?: boolean;
}) {
  const { t } = useTranslation();
  const languageCode = usePlaceLanguage();
  const [category, setCategory] = useState<InterestCategory>('visit');
  const [visible, setVisible] = useState(() => new Set<string>());
  const state = useNearbyPlaces(center, category, languageCode, enabled);
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: { item: ExplorePlace; isViewable?: boolean }[] }) => {
      setVisible(new Set(viewableItems.filter((item) => item.isViewable).map((item) => item.item.placeId)));
    },
    [],
  );
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
            message={!state.loading && !state.error && !state.places.length ? t('places.noResults') : undefined}
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
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 10 }}
        renderItem={({ item, index }) => (
          <NearbyCard
            place={item}
            cityName={cityName}
            languageCode={languageCode}
            photoEnabled={enabled && (visible.has(item.placeId) || (visible.size === 0 && index < 3))}
          />
        )}
      />
      {state.places.length > 0 && (
        <View style={{ paddingHorizontal: 25 }}>
          <PlacesAttribution showGoogle />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: fonts.serifItalic, fontSize: 32, color: colors.secondary, paddingHorizontal: 25 },
  scope: { fontFamily: fonts.sansRegular, fontSize: 12, color: colors.textSecondary, paddingHorizontal: 25 },
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
  image: { height: 165, backgroundColor: colors.surfaceAlt },
  cardBody: { padding: 12, gap: 6 },
  titleRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  cardTitle: { flex: 1, fontFamily: fonts.sansBold, fontSize: 14, color: colors.secondary },
  rating: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.primary700 },
  address: { fontFamily: fonts.sansRegular, fontSize: 12, lineHeight: 18, color: colors.secondary300 },
});
