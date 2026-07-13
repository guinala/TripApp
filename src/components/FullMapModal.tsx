import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Callout, Marker, Polyline, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { dateLocale } from '@/i18n/date';
import { categoryColors, colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { ACTIVITY_ICON } from '@/constants/activityIcons';
import { useTripDetail } from '@/context/TripDetailContext';
import { formatDistance, routeDistanceKm } from '@/utils/routedDistance';
import type { Activity } from '@/types/activity';

const EDGE_PADDING = { top: 190, right: 60, bottom: 330, left: 60 };

function withAlpha(hex: string, opacity: number): string {
  const a = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

function formatDuration(min: number): string {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const rest = min % 60;
  return rest === 0 ? `${h}h` : `${h}h ${rest}min`;
}

function NumberedPin({ number, selected }: { number: number; selected: boolean }) {
  return (
    <View style={styles.pinWrapper}>
      <View style={[styles.pinCircle, selected && styles.pinCircleSelected]}>
        <Text style={[styles.pinNumber, selected && styles.pinNumberSelected]}>{number}</Text>
      </View>
      <View style={[styles.pinTail, selected && styles.pinTailSelected]} />
    </View>
  );
}

export function FullMapModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { trip, days, activities, selectedDayId, setSelectedDayId } = useTripDetail();

  const mapRef = useRef<MapView>(null);
  const regionRef = useRef<Region | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');

  const dayById = useMemo(() => new Map(days.map((d) => [d.id, d])), [days]);
  const selectedDay = selectedDayId ? (dayById.get(selectedDayId) ?? null) : null;

  const scoped = useMemo(() => {
    const inScope =
      selectedDayId === null ? activities : activities.filter((a) => a.dayId === selectedDayId);
    return [...inScope].sort((a, b) => {
      const dayA = dayById.get(a.dayId)?.dayNumber ?? 0;
      const dayB = dayById.get(b.dayId)?.dayNumber ?? 0;
      return dayA !== dayB ? dayA - dayB : a.orderIndex - b.orderIndex;
    });
  }, [activities, selectedDayId, dayById]);

  const located = useMemo(() => scoped.filter((a) => a.location != null), [scoped]);

  const routePoints = useMemo(
    () => located.map((a) => ({ latitude: a.location!.lat, longitude: a.location!.lng })),
    [located],
  );

  const distanceKm = useMemo(() => routeDistanceKm(located.map((a) => a.location!)), [located]);

  useEffect(() => {
    if (!visible || routePoints.length === 0) return;
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(routePoints, {
        edgePadding: EDGE_PADDING,
        animated: true,
      });
    }, 350);
    return () => clearTimeout(t);
  }, [visible, routePoints]);

  const selectDay = (dayId: string | null) => {
    setSelectedDayId(dayId);
    setSelectedActivityId(null);
  };

  const selectActivity = (a: Activity) => {
    setSelectedActivityId(a.id);
    if (a.location) {
      mapRef.current?.animateCamera(
        { center: { latitude: a.location.lat, longitude: a.location.lng } },
        { duration: 300 },
      );
    }
  };

  const zoomBy = (factor: number) => {
    const region = regionRef.current;
    if (!region) return;
    mapRef.current?.animateToRegion(
      {
        ...region,
        latitudeDelta: region.latitudeDelta * factor,
        longitudeDelta: region.longitudeDelta * factor,
      },
      200,
    );
  };

  const recenter = () => {
    if (routePoints.length === 0) return;
    mapRef.current?.fitToCoordinates(routePoints, { edgePadding: EDGE_PADDING, animated: true });
  };

  const calloutMeta = (a: Activity): string => {
    const parts = [t('itinerary.dayNumber', { number: dayById.get(a.dayId)?.dayNumber ?? '?' })];
    if (a.time) parts.push(a.time);
    if (a.durationMinutes) parts.push(formatDuration(a.durationMinutes));
    return parts.join(' · ');
  };

  const sheetLabel = selectedDay
    ? t('itinerary.dayLabel', {
        number: selectedDay.dayNumber,
        date: format(parseISO(selectedDay.date), 'd MMM', { locale: dateLocale() }),
      }).toUpperCase()
    : t('map.wholeTrip').toUpperCase();
  const sheetTitle = selectedDay?.title ?? trip.title;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_DEFAULT}
          mapType={mapType}
          onRegionChangeComplete={(r) => {
            regionRef.current = r;
          }}
        >
          {routePoints.length > 1 && (
            <Polyline
              coordinates={routePoints}
              strokeColor={colors.primary}
              strokeWidth={3}
              lineDashPattern={[1, 10]}
            />
          )}

          {located.map((a, index) => {
            const isSelected = a.id === selectedActivityId;
            return (
              <Marker
                key={a.id}
                coordinate={{ latitude: a.location!.lat, longitude: a.location!.lng }}
                anchor={{ x: 0.5, y: 1 }}
                onPress={() => setSelectedActivityId(a.id)}
                // Android necesita true para repintar el pin al seleccionar
                tracksViewChanges={Platform.OS === 'android'}
                zIndex={isSelected ? 10 : 1}
              >
                <NumberedPin number={index + 1} selected={isSelected} />
                <Callout tooltip>
                  <View style={styles.callout}>
                    <View style={styles.calloutIcon}>
                      <Ionicons name="location" size={16} color={colors.primary} />
                    </View>
                    <View style={styles.calloutInfo}>
                      <Text style={styles.calloutTitle} numberOfLines={1}>
                        {a.title}
                      </Text>
                      <Text style={styles.calloutMeta}>{calloutMeta(a)}</Text>
                    </View>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>

        <View style={[styles.header, { top: insets.top + spacing.s2 }]}>
          <Pressable style={styles.headerBtn} onPress={onClose} hitSlop={6}>
            <Ionicons name="arrow-back" size={20} color={colors.secondary} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {trip.title}
            </Text>
            <Text style={styles.headerSubtitle}>
              {t('itinerary.activitiesCount', { count: located.length })}
              {located.length > 1 ? ` · ${formatDistance(distanceKm)}` : ''}
            </Text>
          </View>
          <Pressable
            style={styles.headerBtn}
            onPress={() => setMapType((t) => (t === 'standard' ? 'satellite' : 'standard'))}
            hitSlop={6}
          >
            <Ionicons name="layers-outline" size={20} color={colors.secondary} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.chipsScroll, { top: insets.top + 76 }]}
          contentContainerStyle={styles.chipsRow}
        >
          <Pressable
            style={[styles.chip, selectedDayId === null && styles.chipActive]}
            onPress={() => selectDay(null)}
          >
            <Text style={[styles.chipText, selectedDayId === null && styles.chipTextActive]}>
              {t('itinerary.dayFilter.all')}
            </Text>
          </Pressable>
          {days.map((d) => {
            const active = selectedDayId === d.id;
            return (
              <Pressable
                key={d.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => selectDay(d.id)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {t('itinerary.dayFilter.day', { number: d.dayNumber })}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.controls}>
          <Pressable style={styles.controlBtn} onPress={() => zoomBy(0.5)}>
            <Ionicons name="add" size={22} color={colors.secondary} />
          </Pressable>
          <Pressable style={styles.controlBtn} onPress={() => zoomBy(2)}>
            <Ionicons name="remove" size={22} color={colors.secondary} />
          </Pressable>
          <Pressable style={styles.controlBtn} onPress={recenter}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>

        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.s3 }]}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderInfo}>
              <Text style={styles.sheetLabel}>{sheetLabel}</Text>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {sheetTitle}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.sheetLink}>{t('map.viewList')} →</Text>
            </Pressable>
          </View>

          {scoped.length === 0 ? (
            <Text style={styles.sheetEmpty}>
              {selectedDay ? t('map.emptyDay') : t('map.emptyTrip')}
            </Text>
          ) : (
            <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
              {scoped.map((a) => {
                const isSelected = a.id === selectedActivityId;
                const tint = categoryColors[a.category];
                return (
                  <Pressable
                    key={a.id}
                    style={[styles.row, isSelected && styles.rowSelected]}
                    onPress={() => selectActivity(a)}
                  >
                    <Text style={styles.rowTime}>{a.time ?? '--:--'}</Text>
                    <View style={[styles.rowIcon, { backgroundColor: withAlpha(tint, 0.15) }]}>
                      <Ionicons name={ACTIVITY_ICON[a.category]} size={16} color={tint} />
                    </View>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {a.title}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={isSelected ? colors.primary : colors.secondary300}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceCream,
  },
  header: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    backgroundColor: colors.surfacePaper,
    borderRadius: radius.xl2,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.secondary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 1,
  },
  headerTitle: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.micro,
    color: colors.secondary300,
  },
  chipsScroll: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexGrow: 0,
  },
  chipsRow: {
    paddingHorizontal: 14,
    gap: spacing.s2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: spacing.s2,
    borderRadius: radius.pill,
    backgroundColor: colors.surfacePaper,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chipActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
  },
  chipText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.label,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
  },
  pinWrapper: {
    alignItems: 'center',
  },
  pinCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.secondary,
    borderWidth: 2.5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  pinCircleSelected: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
  },
  pinNumber: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.label,
    color: colors.white,
  },
  pinNumberSelected: {
    fontSize: fontSize.base,
  },
  pinTail: {
    width: 12,
    height: 12,
    marginTop: -8,
    borderRadius: 2,
    backgroundColor: colors.secondary,
    transform: [{ rotate: '45deg' }],
  },
  pinTailSelected: {
    backgroundColor: colors.primary,
  },
  callout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
    backgroundColor: colors.surfacePaper,
    borderRadius: radius.lg,
    padding: 10,
    minWidth: 200,
    marginBottom: spacing.s2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  calloutIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutInfo: {
    flex: 1,
    gap: 2,
  },
  calloutTitle: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  calloutMeta: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.micro,
    color: colors.secondary300,
  },
  controls: {
    position: 'absolute',
    right: 14,
    bottom: 300,
    gap: spacing.s2,
  },
  controlBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfacePaper,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surfacePaper,
    borderTopLeftRadius: radius.xl2,
    borderTopRightRadius: radius.xl2,
    paddingHorizontal: 20,
    paddingTop: spacing.s2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(colors.secondary, 0.18),
    marginBottom: spacing.s3,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.s3,
    marginBottom: spacing.s3,
  },
  sheetHeaderInfo: {
    flex: 1,
    gap: 2,
  },
  sheetLabel: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.micro,
    letterSpacing: 0.4,
    color: colors.secondary300,
  },
  sheetTitle: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.title,
    color: colors.textPrimary,
  },
  sheetLink: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.label,
    color: colors.primary,
    paddingTop: spacing.s1,
  },
  sheetEmpty: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.sm,
    color: colors.secondary300,
    paddingVertical: spacing.s4,
  },
  sheetList: {
    maxHeight: 168,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    paddingVertical: 10,
    paddingHorizontal: spacing.s2,
    borderRadius: radius.md,
  },
  rowSelected: {
    backgroundColor: colors.primary50,
  },
  rowTime: {
    width: 46,
    fontFamily: fonts.sansBold,
    fontSize: fontSize.label,
    color: colors.textPrimary,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    flex: 1,
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
});
