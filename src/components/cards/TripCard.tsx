import { useState } from 'react';
import { dateLocale } from '@/i18n/date';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import type { Trip } from '@/types/trip';
import { useTripDestinationLabel } from '@/hooks/use-trip-destination-label';
import { PlacesAttribution } from '@/components/explore/PlacesAttribution';

type TripCardProps = {
  trip: Trip;
  resolveDestination?: boolean;
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

export function TripCard({ trip, resolveDestination = false }: TripCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const badge = getBadge(trip, t);
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const hasCover = !!trip.coverImage && failedCover !== trip.coverImage;
  const destination = useTripDestinationLabel(trip, resolveDestination);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${trip.title}, ${destination.label}`}
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/trips/[id]/itinerary',
          params: { id: trip.id },
        })
      }
    >
      {hasCover ? (
        <Image
          source={{ uri: trip.coverImage! }}
          onError={() => setFailedCover(trip.coverImage)}
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
        <Text style={[styles.title, !hasCover && { color: colors.secondary, textShadowRadius: 0 }]}>
          {trip.title}
        </Text>
        <Text style={{ fontFamily: fonts.sansRegular, color: colors.secondary }}>
          {destination.label}
        </Text>
        <Text style={{ fontFamily: fonts.sansRegular, color: colors.textSecondary }}>
          {format(parseISO(trip.startDate), 'd MMM', { locale: dateLocale() })} –{' '}
          {format(parseISO(trip.endDate), 'd MMM yyyy', { locale: dateLocale() })}
        </Text>
        {destination.place && (
          <View
            style={{ backgroundColor: colors.surfacePaper, borderRadius: 6, paddingHorizontal: 4 }}
          >
            <PlacesAttribution attributions={destination.place.attributions} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // shadowWrapper: {
  //   borderRadius: radius.lg,
  //   shadowColor: colors.secondary,
  //   shadowOffset: { width: 0, height: 4 },
  //   shadowOpacity: 0.12,
  //   shadowRadius: 8,
  //   elevation: 4,
  // },
  card: {
    minHeight: 180,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    padding: 10,
    justifyContent: 'space-between',
    marginBottom: 5,
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
  titleWrap: {
    alignItems: 'flex-start',
    backgroundColor: colors.surfacePaper,
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  title: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.title,
    color: colors.secondary,
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
});
