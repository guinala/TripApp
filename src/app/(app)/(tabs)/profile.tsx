import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { differenceInMonths, differenceInYears, parseISO } from 'date-fns';
import { colors, fonts } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { useUserStats } from '@/hooks/use-user-stats';
import { useTripStore } from '@/store/tripStore';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { StatsPill } from '@/components/profile/StatsPill';
import { ProfileOptionCard } from '@/components/profile/ProfileOptionsCard';
import { VisitedCountriesMap } from '@/components/profile/VisitedCountriesMap';

function activeSince(createdAt: string): string {
  const created = parseISO(createdAt);
  const years = differenceInYears(new Date(), created);
  if (years >= 1) return `${years} ${years === 1 ? 'año' : 'años'} activo`;
  const months = differenceInMonths(new Date(), created);
  if (months >= 1) return `${months} ${months === 1 ? 'mes' : 'meses'} activo`;
  return 'nuevo viajero';
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const profile = useProfileStore((s) => s.profile);
  const loadProfile = useProfileStore((s) => s.load);
  const trips = useTripStore((s) => s.trips);

  const { stats, reload } = useUserStats(userId);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (userId && !profile) loadProfile(userId);
  }, [userId, profile, loadProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([userId ? loadProfile(userId) : null, reload()]);
    setRefreshing(false);
  }, [userId, loadProfile, reload]);

  const statItems = useMemo(
    () => [
      { value: String(stats?.tripCount ?? '—'), label: 'Viajes' },
      { value: String(stats?.countriesCount ?? '—'), label: 'Países' },
      {
        value: stats?.kilometers != null ? stats.kilometers.toLocaleString('es-ES') : '—',
        label: 'Kilómetros',
      },
    ],
    [stats],
  );

  const handleShare = useCallback(() => {
    Share.share({
      message: 'Estoy planificando mis viajes con TripMate ✈️ ¡Pruébala!',
    });
  }, []);

  const displayName = profile?.displayName || 'Viajero';
  const subtitle = [user?.email, profile ? activeSince(profile.createdAt) : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.configRow}>
          <Pressable
            style={styles.configButton}
            onPress={() => router.push('/settings')}
            hitSlop={8}
            accessibilityLabel="Abrir ajustes"
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

        <StatsPill items={statItems} />

        <View style={styles.mapSection}>
          <Text style={styles.mapTitle}>
            Mapa del <Text style={styles.mapTitleAccent}>mundo</Text>
          </Text>
          <VisitedCountriesMap visited={stats?.countryCodes ?? []} />
        </View>

        <View style={styles.cards}>
          <ProfileOptionCard
            icon="briefcase-outline"
            title="Plantillas de Equipaje"
            subtitle="Reutiliza listas de otros viajes"
            onPress={() => router.push('/packing-templates')}
          />
          <ProfileOptionCard
            icon="book-outline"
            title="Diarios de Viajes"
            subtitle={`${trips.length} ${trips.length === 1 ? 'diario' : 'diarios'}`}
            onPress={() => router.push('/(app)/(tabs)')}
          />
          <ProfileOptionCard
            icon="bar-chart-outline"
            title="Consultar estadísticas"
            subtitle={`Consultar ${stats?.tripCount ?? 0} viajes`}
            onPress={() => router.push('/stats')}
          />
          <ProfileOptionCard
            icon="share-social-outline"
            title="Comparte TripMate"
            subtitle="Invita a un amigo"
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
