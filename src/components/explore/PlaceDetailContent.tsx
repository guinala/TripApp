import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { PlaceDetails } from '@/types/place';
import type { EditorialDestination } from '@/types/destination';
import { colors, fonts } from '@/constants/theme';
import { useUnsplashCover } from '@/hooks/use-unsplash-photos';
import { isDestination } from '@/utils/editorial-place';
import { RemoteImage } from '@/components/ui/RemoteImage';
import { PlacesAttribution } from './PlacesAttribution';
import { PlacesStatus } from './PlacesStatus';
import { NearbyPlacesSection } from './NearbyPlacesSection';
import { DestinationStatsCard } from './DestinationStatsCard';

export function PlaceDetailContent({
  place,
  editorial,
  locating = false,
  locationError,
  onRetryLocation,
}: {
  place: PlaceDetails | null;
  editorial?: EditorialDestination;
  locating?: boolean;
  locationError?: boolean;
  onRetryLocation?: () => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [actionError, setActionError] = useState<string | null>(null);
  const name = place?.name ?? editorial?.name ?? '';
  const country = place?.countryName ?? editorial?.country ?? '';
  const destination = !!editorial || (!!place && isDestination(place.types));
  const cover = useUnsplashCover(editorial?.coverQuery ?? `${name} ${country}`);
  const createTrip = () =>
    router.push({
      pathname: '/trips/new',
      params: place ? { placeId: place.placeId } : { destination: `${name}, ${country}` },
    });
  const addToTrip = () =>
    place
      ? router.push({ pathname: '/places/[placeId]/trips', params: { placeId: place.placeId } })
      : createTrip();
  const share = () => {
    void Share.share({
      message: [name, country, place?.googleMapsUri].filter(Boolean).join(' · '),
    }).catch(() => setActionError('share'));
  };
  const openLink = (url: string) => {
    void Linking.openURL(url).catch(() => setActionError('link'));
  };
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 64 }]}>
          {cover.photo && <RemoteImage uri={cover.photo.regularUrl} label={name} />}
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
          {cover.loading && <ActivityIndicator style={styles.photoStatus} color={colors.white} />}
          {cover.error && (
            <Pressable accessibilityRole="button" onPress={cover.retry} style={styles.photoStatus}>
              <Text style={styles.heroCaption}>{t('fixes.imageRetry')}</Text>
            </Pressable>
          )}
          <View pointerEvents="none" style={styles.heroInfo}>
            <Text style={styles.heroCaption}>
              {[editorial && t(`places.continents.${editorial.continent}`), country]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            <Text style={styles.heroTitle}>{name}</Text>
          </View>
        </View>
        <View style={styles.stats}>
          <DestinationStatsCard location={place?.location ?? null} editorial={editorial} />
        </View>
        <View style={styles.body}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('destination.about')} <Text style={{ color: colors.primary }}>{name}</Text>
            </Text>
            {editorial?.description ? (
              <Text
                style={styles.description}
                accessibilityLanguage={editorial.descriptionLanguage}
              >
                {editorial.description}
              </Text>
            ) : (
              <Text style={styles.description}>
                {place?.address ?? t('placesUI.discoverArea', { name })}
              </Text>
            )}
            {locating && <PlacesStatus loading />}
            {locationError && (
              <PlacesStatus message={t('places.locationUnavailable')} onRetry={onRetryLocation} />
            )}
          </View>
          {destination && place?.location && (
            <NearbyPlacesSection center={place.location} cityName={name} />
          )}
          <View style={styles.actions}>
            {place && (
              <Pressable accessibilityRole="button" onPress={createTrip} style={styles.textButton}>
                <Ionicons name="airplane-outline" size={20} color={colors.primary700} />
                <Text style={styles.actionLabel}>{t('places.createTrip')}</Text>
              </Pressable>
            )}
            {place?.googleMapsUri && /^https:\/\//i.test(place.googleMapsUri) && (
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
            {place?.location && <Text style={styles.creditText}>{t('places.currentWeather')}</Text>}
            {place && <PlacesAttribution attributions={place.attributions} />}
            {cover.photo && (
              <Pressable
                accessibilityRole="link"
                onPress={() => openLink(cover.photo!.authorLink)}
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <Text style={styles.creditText}>
                  {t('placesUI.photoCredit', { author: cover.photo.authorName })}
                </Text>
              </Pressable>
            )}
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
          <Text style={styles.primaryLabel}>
            {t(place ? 'places.addToTrip' : 'places.createTrip')}
          </Text>
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
  photoStatus: { position: 'absolute', top: 120, alignSelf: 'center', padding: 12 },
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
