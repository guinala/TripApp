import { PlacesStatus } from '@/components/explore/PlacesStatus';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { differenceInMonths, differenceInYears, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { colors, fonts } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { useUserStats } from '@/hooks/use-user-stats';
import { useTripStore } from '@/store/tripStore';
import { syncLanguage } from '@/i18n';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { StatsPill } from '@/components/profile/StatsPill';
import { ProfileOptionCard } from '@/components/profile/ProfileOptionsCard';
import { VisitedCountriesMap } from '@/components/profile/VisitedCountriesMap';

function activeSince(createdAt: string, t: TFunction): string {
  const created = parseISO(createdAt);
  const years = differenceInYears(new Date(), created);
  if (years >= 1) return t('profile.activeYears', { count: years });
  const months = differenceInMonths(new Date(), created);
  if (months >= 1) return t('profile.activeMonths', { count: months });
  return t('profile.newTraveler');
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const scroll = useRef<ScrollView>(null);
  const statsY = useRef(0);
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const profile = useProfileStore((s) => s.profile);
  const loadProfile = useProfileStore((s) => s.load);
  const trips = useTripStore((s) => s.trips);

  const { stats, reload, loading: statsLoading, error: statsError } = useUserStats(userId);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (userId && !profile) loadProfile(userId);
  }, [userId, profile, loadProfile]);

  useEffect(() => {
    if (profile) syncLanguage(profile.preferredLanguage);
  }, [profile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    reload();
    try {
      if (userId) await loadProfile(userId);
    } finally {
      setRefreshing(false);
    }
  }, [userId, loadProfile, reload]);

  const numberLocale = i18n.language === 'es' ? 'es-ES' : 'en-US';
  const statItems = useMemo(
    () => [
      { value: String(stats?.tripCount ?? '—'), label: t('profile.stats.trips') },
      {
        value: stats?.unresolvedDestinationsCount
          ? stats.countriesCount > 0
            ? `${stats.countriesCount}+`
            : '—'
          : String(stats?.countriesCount ?? '—'),
        label: t('profile.stats.countries'),
      },
      {
        value: stats?.kilometers != null ? stats.kilometers.toLocaleString(numberLocale) : '—',
        label: t('profile.stats.kilometers'),
      },
    ],
    [stats, t, numberLocale],
  );

  const handleShare = useCallback(() => {
    Share.share({
      message: t('profile.shareMessage'),
    });
  }, [t]);

  const displayName = profile?.displayName || t('profile.defaultName');
  const subtitle = [user?.email, profile ? activeSince(profile.createdAt, t) : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing || statsLoading} onRefresh={onRefresh} />
        }
      >
        <View style={styles.configRow}>
          <Pressable
            style={styles.configButton}
            onPress={() => router.push('/settings')}
            hitSlop={8}
            accessibilityLabel={t('profile.openSettings')}
          >
            <Ionicons name="settings-sharp" size={20} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.header}>
          <ProfileAvatar
            name={displayName}
            avatarUrl={profile?.avatarUrl ?? null}
            onPressEdit={() => router.push('/profile/edit')}
          />
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View
          onLayout={(event) => {
            statsY.current = event.nativeEvent.layout.y;
          }}
        >
          <StatsPill items={statItems} />
        </View>
        <PlacesStatus
          loading={statsLoading}
          error={statsError}
          onRetry={statsError ? reload : undefined}
        />
        {!!stats?.unresolvedDestinationsCount && (
          <PlacesStatus
            message={t('places.unresolvedCountries', { count: stats.unresolvedDestinationsCount })}
            onRetry={reload}
          />
        )}
        {!!stats?.resolutionFailures && (
          <PlacesStatus message={t('places.statsResolutionFailed')} onRetry={reload} />
        )}
        {stats?.kilometersPartial && <PlacesStatus message={t('places.partialKilometers')} />}

        <View style={styles.mapSection}>
          <Text style={styles.mapTitle}>
            {t('profile.mapTitleStart')}
            <Text style={styles.mapTitleAccent}>{t('profile.mapTitleAccent')}</Text>
          </Text>
          <VisitedCountriesMap visited={stats?.countryCodes ?? []} />
        </View>

        <View style={styles.cards}>
          <ProfileOptionCard
            icon="briefcase-outline"
            title={t('profile.options.packingTemplates')}
            subtitle={t('profile.options.packingTemplatesSubtitle')}
            onPress={() =>
              router.push({ pathname: '/profile/trips', params: { section: 'packing' } })
            }
          />
          <ProfileOptionCard
            icon="book-outline"
            title={t('profile.options.diaries')}
            subtitle={t('profile.options.diariesCount', { count: trips.length })}
            onPress={() =>
              router.push({ pathname: '/profile/trips', params: { section: 'diary' } })
            }
          />
          <ProfileOptionCard
            icon="bar-chart-outline"
            title={t('profile.options.stats')}
            subtitle={t('profile.options.statsSubtitle', { count: stats?.tripCount ?? 0 })}
            onPress={() => scroll.current?.scrollTo({ y: statsY.current, animated: true })}
          />
          <ProfileOptionCard
            icon="share-social-outline"
            title={t('profile.options.share')}
            subtitle={t('profile.options.shareSubtitle')}
            onPress={handleShare}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceCream },
  content: {
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: 50,
    gap: 30,
  },
  configRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  configButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(27, 45, 79, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { alignItems: 'center', gap: 10, marginTop: -20 },
  name: {
    fontFamily: fonts.serifItalic,
    fontSize: 30,
    color: '#000',
    marginTop: 10,
  },
  subtitle: {
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    color: colors.secondary300,
  },
  mapSection: { gap: 10 },
  mapTitle: {
    fontFamily: fonts.serifItalic,
    fontSize: 30,
    color: '#000',
  },
  mapTitleAccent: { color: colors.primary },
  cards: { gap: 5 },
});
