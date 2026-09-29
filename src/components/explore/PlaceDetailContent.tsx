import { useState } from 'react';
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useIsFocused } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { PlaceContent } from '@/types/explore';
import { colors, fonts } from '@/constants/theme';
import { usePlaceLanguage } from '@/hooks/use-place-details';
import {
  descriptionText,
  MISSING_PLACE_VALUE,
  placeCategoryKey,
  placeLocationLabel,
  shouldShowRating,
  shouldShowWeather,
} from '@/utils/place-presentation';
import { supportsNearbyPlaces } from '@/utils/place-kind';
import { PlacePhoto } from './PlacePhoto';
import { PlacesAttribution } from './PlacesAttribution';
import { PlacesStatus } from './PlacesStatus';
import { NearbyPlacesSection } from './NearbyPlacesSection';
import { DestinationStatsCard } from './DestinationStatsCard';
import { usePlacePhoto } from '@/hooks/use-place-photo';
import { PhotoAttribution } from './PhotoAttribution';

export function PlaceDetailContent({ content }: { content: PlaceContent }) {
  const { t } = useTranslation();
  const languageCode = usePlaceLanguage();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [actionError, setActionError] = useState<string | null>(null);
  const place = content.place;
  const photoState = usePlacePhoto({
    placeId: place.placeId,
    name: place.name,
    types: place.types,
    localityName: place.localityName,
    countryName: place.countryName,
    location: place.location,
    countryCode: place.countryCode,
    size: 'hero',
    languageCode,
    enabled: focused,
  });
  const name = place.name;
  const country = place.countryName ?? MISSING_PLACE_VALUE;
  const description = descriptionText(
    content.description,
    t('dynamicExplore.descriptionUnavailable'),
  );
  const createTrip = () =>
    router.push({ pathname: '/trips/new', params: { placeId: place.placeId } });
  const addToTrip = () =>
    router.push({ pathname: '/places/[placeId]/trips', params: { placeId: place.placeId } });
  const share = () => {
    void Share.share({
      message: [name, country, place.googleMapsUri].filter(Boolean).join(' · '),
    }).catch(() => setActionError('share'));
  };
  const openLink = (url: string) => {
    void Linking.openURL(url).catch(() => setActionError('link'));
  };

  const showWeather = shouldShowWeather(place.types, place.location);

  const showStats = shouldShowRating(place.types, content.rating) || showWeather;

  const locationLabel = placeLocationLabel(place);

  const detailSubtitle = [locationLabel, t(`dynamicExplore.kind.${placeCategoryKey(place.types)}`)]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 64 }]}>
          <PlacePhoto state={photoState} name={place.name} style={StyleSheet.absoluteFill} />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(15,27,51,0.12)', 'rgba(15,27,51,0.72)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.controls, { top: insets.top + 8 }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              style={styles.iconButton}
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/explore')
              }
            >
              <Ionicons name="chevron-back" size={30} color={colors.white} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('placesUI.share')}
              style={styles.iconButton}
              onPress={share}
            >
              <Ionicons name="share-outline" size={27} color={colors.white} />
            </Pressable>
          </View>
          <View pointerEvents="none" style={styles.heroInfo}>
            <Text style={styles.heroCaption}>{detailSubtitle}</Text>
            <Text style={styles.heroTitle}>{name}</Text>
          </View>
        </View>
        {showStats && (
          <View style={styles.stats}>
            <DestinationStatsCard content={content} />
          </View>
        )}
        <View style={styles.body}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('destination.about')} <Text style={{ color: colors.primary }}>{name}</Text>
            </Text>
            <Text
              style={styles.description}
              accessibilityLanguage={content.description?.languageCode ?? undefined}
            >
              {description}
            </Text>
            {photoState.photo && <PhotoAttribution credits={photoState.photo.credits} />}
            {place.address && (
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={20} color={colors.primary700} />
                <Text style={styles.address}>{place.address}</Text>
              </View>
            )}
          </View>
          {focused && place.location && supportsNearbyPlaces(place.types) && (
            <NearbyPlacesSection center={place.location} cityName={name} enabled={focused} />
          )}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={createTrip} style={styles.textButton}>
              <Ionicons name="airplane-outline" size={20} color={colors.primary700} />
              <Text style={styles.actionLabel}>{t('places.createTrip')}</Text>
            </Pressable>
            {place.googleMapsUri && /^https:\/\//i.test(place.googleMapsUri) && (
              <Pressable
                accessibilityRole="link"
                onPress={() => openLink(place.googleMapsUri!)}
                style={styles.textButton}
              >
                <Ionicons name="map-outline" size={20} color={colors.primary700} />
                <Text style={styles.actionLabel}>{t('places.openMaps')}</Text>
              </Pressable>
            )}
          </View>
          <PlacesStatus error={actionError} />
          <View style={styles.credits}>
            {showWeather && <Text style={styles.creditText}>{t('places.currentWeather')}</Text>}
            <PlacesAttribution attributions={place.attributions} showGoogle />
          </View>
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.8 }]}
          onPress={addToTrip}
        >
          <Ionicons name="add" size={22} color={colors.white} />
          <Text style={styles.primaryLabel}>{t('places.addToTrip')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceCream },
  hero: { minHeight: 315, backgroundColor: colors.secondary700, justifyContent: 'flex-end' },
  controls: {
    position: 'absolute',
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(15,27,51,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: { paddingHorizontal: 24, paddingTop: 70, paddingBottom: 68, gap: 8 },
  heroCaption: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.white },
  heroTitle: { fontFamily: fonts.serifItalic, fontSize: 44, color: colors.white },
  stats: { marginTop: -40, paddingHorizontal: 21 },
  body: { paddingTop: 28, gap: 28 },
  section: { paddingHorizontal: 25, gap: 12 },
  sectionTitle: { fontFamily: fonts.serifItalic, fontSize: 32, color: colors.secondary },
  description: {
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.secondary300,
  },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  address: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  actions: { paddingHorizontal: 25, gap: 4 },
  textButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.primary700,
    flexShrink: 1,
  },
  credits: { paddingHorizontal: 25 },
  creditText: { fontFamily: fonts.sansRegular, fontSize: 12, color: colors.textSecondary },
  footer: { backgroundColor: colors.surfaceCream, paddingHorizontal: 25, paddingTop: 12 },
  primaryButton: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  primaryLabel: { color: colors.white, fontFamily: fonts.sansBold, fontSize: 16, flexShrink: 1 },
});
