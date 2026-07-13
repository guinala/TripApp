import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import type { Trip } from '@/types/trip';

type TripCardProps = {
  trip: Trip;
};

function getBadge(trip: Trip, t: TFunction): { label: string; color: string } {
  if (trip.status === 'active') return { label: t('trips.badge.active'), color: colors.success };
  if (trip.status === 'completed')
    return { label: t('trips.badge.completed'), color: colors.textMetadata };

  const days = differenceInCalendarDays(parseISO(trip.startDate), new Date());
  const label =
    days <= 0
      ? t('trips.badge.today')
      : days === 1
        ? t('trips.badge.tomorrow')
        : t('trips.badge.inDays', { count: days });
  return { label, color: colors.primary };
}

export function TripCard({ trip }: TripCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const badge = getBadge(trip, t);

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/trips/${trip.id}`)}>
      {trip.coverImage ? (
        <Image
          source={{ uri: trip.coverImage }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
      )}

      <View style={styles.badge}>
        <Ionicons name="time-outline" size={10} color={badge.color} />
        <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
      </View>

      <View style={styles.titleWrap}>
        <Text style={styles.title}>{trip.destination}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 130,
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: 10,
    justifyContent: 'space-between',
  },
  placeholder: { backgroundColor: colors.surfaceCream },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, letterSpacing: 0.3 },
  titleWrap: { alignItems: 'flex-end' },
  title: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.title,
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.69)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
});
