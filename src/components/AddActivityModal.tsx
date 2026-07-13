import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { dateLocale } from '@/i18n/date';
import { categoryColors, colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { usePlacesAutocomplete } from '@/hooks/use-places-autocomplete';
import { useTripDetail } from '@/context/TripDetailContext';
import type { ActivityCategory } from '@/types/activity';
import type { PlaceDetails } from '@/services/places';
import { TimeField } from './TimeField';

const CATEGORIES: {
  key: ActivityCategory;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'visit', labelKey: 'itinerary.categories.visit', icon: 'camera' },
  { key: 'restaurant', labelKey: 'itinerary.categories.restaurant', icon: 'restaurant' },
  { key: 'transport', labelKey: 'itinerary.categories.transport', icon: 'airplane' },
  { key: 'hotel', labelKey: 'itinerary.categories.hotel', icon: 'bed' },
  { key: 'entertainment', labelKey: 'itinerary.categories.entertainment', icon: 'musical-notes' },
];

type AddActivityModalProps = {
  dayId: string | null;
  onClose: () => void;
};

export function AddActivityModal({ dayId, onClose }: AddActivityModalProps) {
  const { t } = useTranslation();
  const { days, addActivity, trip } = useTripDetail();
  const { query, setQuery, suggestions, loading, selectPlace } = usePlacesAutocomplete();

  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const [time, setTime] = useState('');
  const [hours, setHours] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('visit');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const day = days.find((d) => d.id === dayId);

  const close = () => {
    setQuery('');
    setPlace(null);
    setTime('');
    setHours('');
    setCategory('visit');
    setCost('');
    setNotes('');
    onClose();
  };

  const onSubmit = async () => {
    if (!dayId || !query.trim()) return;
    setSaving(true);
    try {
      await addActivity({
        dayId,
        title: query.trim(),
        time: time.trim() || null,
        durationMinutes: hours ? Math.round(parseFloat(hours) * 60) : null,
        location: place?.location ?? null,
        address: place?.address ?? null,
        placeId: place?.placeId ?? null,
        category,
        estimatedCost: cost ? parseFloat(cost) : null,
        notes: notes.trim() || null,
      });
      close();
    } catch {
      setSaving(false);
    }
  };

  const dayLabel = day
    ? t('itinerary.dayShort', {
        number: day.dayNumber,
        date: format(parseISO(day.date), 'EEE d MMM', { locale: dateLocale() }),
      })
    : '';

  return (
    <Modal
      visible={dayId !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.topbar}>
          <Pressable onPress={close} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={colors.secondary} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{t('itinerary.newActivity')}</Text>
            {dayLabel ? <Text style={styles.subtitle}>{dayLabel}</Text> : null}
          </View>
          <Pressable onPress={close} hitSlop={10}>
            <Text style={styles.cancel}>{t('common.cancel')}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={colors.secondary300} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('itinerary.searchPlaceholder')}
              placeholderTextColor={colors.secondary300}
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setPlace(null);
              }}
            />
            {loading ? <ActivityIndicator size="small" /> : null}
          </View>

          {suggestions.length > 0 && !place ? (
            <View style={styles.results}>
              {suggestions.map((s) => (
                <Pressable
                  key={s.placeId}
                  style={styles.result}
                  onPress={async () => setPlace(await selectPlace(s.placeId))}
                >
                  <Ionicons name="location-outline" size={20} color={colors.secondary300} />
                  <View style={styles.resultTexts}>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {s.mainText}
                    </Text>
                    {s.secondaryText ? (
                      <Text style={styles.resultLoc} numberOfLines={1}>
                        {s.secondaryText}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>{t('itinerary.time').toUpperCase()}</Text>
              <TimeField value={time || null} onChange={setTime} />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>{t('itinerary.duration').toUpperCase()}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s2 }}>
                {[
                  { label: '30m', v: 30 },
                  { label: '1h', v: 60 },
                  { label: '1h30', v: 90 },
                  { label: '2h', v: 120 },
                  { label: '3h', v: 180 },
                  { label: t('itinerary.halfDay'), v: 240 },
                ].map((d) => {
                  const active = Math.round((parseFloat(hours) || 0) * 60) === d.v;
                  return (
                    <Pressable
                      key={d.v}
                      onPress={() => setHours(String(d.v / 60))}
                      style={[
                        styles.cat,
                        active && {
                          borderColor: colors.primary,
                          backgroundColor: `${colors.primary}1A`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.catLabel,
                          { color: active ? colors.primary : colors.secondary300 },
                        ]}
                      >
                        {d.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <Text style={styles.label}>{t('itinerary.category').toUpperCase()}</Text>
          <View style={styles.categories}>
            {CATEGORIES.map((c) => {
              const active = category === c.key;
              const tint = categoryColors[c.key];
              return (
                <Pressable
                  key={c.key}
                  onPress={() => setCategory(c.key)}
                  style={[
                    styles.cat,
                    active && { borderColor: tint, backgroundColor: `${tint}1A` },
                  ]}
                >
                  <Ionicons name={c.icon} size={20} color={active ? tint : colors.secondary300} />
                  <Text
                    numberOfLines={1}
                    style={[styles.catLabel, { color: active ? tint : colors.secondary300 }]}
                  >
                    {t(c.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>{t('itinerary.estimatedCost').toUpperCase()}</Text>
          <View style={styles.fieldRow}>
            <TextInput
              style={styles.fieldInput}
              placeholder="0"
              placeholderTextColor={colors.secondary300}
              keyboardType="decimal-pad"
              value={cost}
              onChangeText={setCost}
            />
            {trip?.currency ? (
              <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.secondary300 }}>
                {trip.currency}
              </Text>
            ) : null}
          </View>

          <Text style={styles.label}>{t('itinerary.notes').toUpperCase()}</Text>
          <TextInput
            style={styles.notesInput}
            placeholder={t('itinerary.notesPlaceholder')}
            placeholderTextColor={colors.secondary300}
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.submit, (!query.trim() || saving) && styles.submitDisabled]}
            onPress={onSubmit}
            disabled={!query.trim() || saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitText}>
                {day
                  ? t('itinerary.addToDay', { number: day.dayNumber })
                  : t('itinerary.addToDayGeneric')}
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceCream },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
  },
  titleWrap: { alignItems: 'center' },
  title: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.secondary },
  subtitle: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.micro,
    color: colors.secondary300,
    marginTop: 2,
  },
  cancel: { fontFamily: fonts.sansSemiBold, fontSize: fontSize.sm, color: colors.primary },
  body: { paddingHorizontal: spacing.s5, paddingBottom: spacing.s8, gap: spacing.s4 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: colors.textSubtitle,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s4,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.base,
    color: colors.secondary,
  },
  results: {
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: colors.textSubtitle,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
  },
  resultTexts: { flex: 1 },
  resultName: { fontFamily: fonts.sansSemiBold, fontSize: fontSize.sm, color: colors.secondary },
  resultLoc: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.micro,
    color: colors.secondary300,
  },
  row: { flexDirection: 'row', gap: spacing.s4 },
  half: { flex: 1, gap: spacing.s2 },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.micro,
    color: colors.secondary300,
    letterSpacing: 0.5,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: colors.textSubtitle,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s4,
  },
  fieldInput: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.base,
    color: colors.secondary,
  },
  categories: { flexDirection: 'row', justifyContent: 'space-between' },
  cat: {
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
    gap: spacing.s1,
    paddingVertical: spacing.s3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.secondary100,
  },
  catLabel: { fontFamily: fonts.sansSemiBold, fontSize: fontSize.nano },
  notesInput: {
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: colors.textSubtitle,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s4,
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.base,
    color: colors.secondary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: { paddingHorizontal: spacing.s5, paddingVertical: spacing.s3 },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.s5,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.white },
});
