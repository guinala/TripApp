import { useRef, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TimeField } from './TimeField';
import { DurationPicker } from './DurationPicker';
import { DestinationInput } from '@/components/trips/DestinationInput';
import { PlacesButton, ui } from '@/components/explore/PlacesUI';
import { PlacesStatus } from '@/components/explore/PlacesStatus';
import { PlacesAttribution } from '@/components/explore/PlacesAttribution';
import { usePlaceDetails, usePlaceLanguage } from '@/hooks/use-place-details';
import type { Activity, ActivityCategory } from '@/types/activity';
import type { LatLng } from '@/types/place';
import type { ActivityInput } from '@/services/activities';

type Props = {
  dayId: string;
  currency: string;
  activity?: Activity | null;
  initialPlaceId?: string | null;
  center?: LatLng;
  onSubmit: (input: ActivityInput) => Promise<void>;
  onCancel: () => void;
  onSavingChange?: (saving: boolean) => void;
};

export function ActivityForm({
  dayId,
  currency,
  activity,
  initialPlaceId,
  center,
  onSubmit,
  onCancel,
  onSavingChange,
}: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(activity?.title ?? '');
  const [placeId, setPlaceId] = useState<string | null>(
    activity?.placeId ?? initialPlaceId ?? null,
  );
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeChanged, setPlaceChanged] = useState(!!initialPlaceId && !activity);
  const [time, setTime] = useState(activity?.time ?? '');
  const [durationMinutes, setDurationMinutes] = useState<number | null>(
    activity?.durationMinutes ?? null,
  );
  const [category, setCategory] = useState<ActivityCategory>(activity?.category ?? 'visit');
  const [cost, setCost] = useState(
    activity?.estimatedCost != null ? String(activity.estimatedCost) : '',
  );
  const [notes, setNotes] = useState(activity?.notes ?? '');
  const [selecting, setSelecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const resolution = usePlaceDetails(placeId, usePlaceLanguage());
  const unresolvedNewPlace = placeChanged && !!placeId && resolution.status !== 'ready';
  const save = async () => {
    if (busy.current || selecting || unresolvedNewPlace) return;
    const estimatedCost = cost.trim() ? Number(cost.replace(',', '.')) : null;
    if (
      !title.trim() ||
      (estimatedCost !== null && (!Number.isFinite(estimatedCost) || estimatedCost < 0)) ||
      (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
    ) {
      setError('validation');
      return;
    }
    busy.current = true;
    setSaving(true);
    onSavingChange?.(true);
    setError(null);
    try {
      await onSubmit({
        dayId,
        title: title.trim(),
        time: time || null,
        durationMinutes,
        category,
        estimatedCost,
        notes: notes.trim() || null,
        placeId,
        location: placeChanged ? null : (activity?.location ?? null),
        address: placeChanged ? null : (activity?.address ?? null),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'save');
    } finally {
      busy.current = false;
      setSaving(false);
      onSavingChange?.(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.body}>
        <Text style={ui.title}>{t('places.activityTitle')}</Text>
        <TextInput
          editable={!saving}
          style={ui.input}
          value={title}
          onChangeText={setTitle}
          placeholder={t('places.activityTitlePlaceholder')}
        />
        <Text style={ui.title}>{t('places.associatedPlace')}</Text>
        <DestinationInput
          scope="activities"
          center={center}
          value={
            placeId
              ? (resolution.place?.name ?? activity?.address ?? t('places.linkedPlace'))
              : placeQuery
          }
          disabled={saving}
          onSelectingChange={setSelecting}
          onChangeText={(text) => {
            setPlaceQuery(text);
            setPlaceId(null);
            setPlaceChanged(true);
          }}
          onSelectPlace={(place) => {
            setPlaceId(place.placeId);
            setPlaceChanged(true);
            setPlaceQuery('');
          }}
        />
        {!!placeId && (
          <PlacesButton
            secondary
            title={t('places.removePlace')}
            disabled={saving}
            onPress={() => {
              setPlaceId(null);
              setPlaceChanged(true);
              setPlaceQuery('');
            }}
          />
        )}
        {resolution.place && <PlacesAttribution attributions={resolution.place.attributions} />}
        <PlacesStatus
          loading={resolution.status === 'loading'}
          error={resolution.error}
          onRetry={resolution.error ? resolution.retry : undefined}
        />
        <View style={ui.row}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={ui.text}>{t('itinerary.time')}</Text>
            <TimeField value={time || null} onChange={setTime} />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={ui.text}>{t('itinerary.duration')}</Text>
            <DurationPicker value={durationMinutes} onChange={setDurationMinutes} />
          </View>
        </View>
        <Text style={ui.title}>{t('itinerary.category')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['visit', 'restaurant', 'transport', 'hotel', 'entertainment', 'others'] as const).map(
            (value) => (
              <PlacesButton
                key={value}
                title={t(`itinerary.categories.${value}`)}
                secondary={value !== category}
                disabled={saving}
                onPress={() => setCategory(value)}
              />
            ),
          )}
        </View>
        <Text style={ui.text}>
          {t('itinerary.estimatedCost')} · {currency}
        </Text>
        <TextInput
          editable={!saving}
          style={ui.input}
          keyboardType="decimal-pad"
          value={cost}
          onChangeText={setCost}
          placeholder="0"
        />
        <Text style={ui.text}>{t('itinerary.notes')}</Text>
        <TextInput
          editable={!saving}
          style={[ui.input, { minHeight: 90, textAlignVertical: 'top' }]}
          multiline
          value={notes}
          onChangeText={setNotes}
        />
        <PlacesStatus
          error={error && error !== 'validation' ? error : undefined}
          message={error === 'validation' ? t('places.activityValidation') : undefined}
        />
        <PlacesButton
          title={t(saving ? 'common.saving' : 'common.save')}
          onPress={() => {
            void save();
          }}
          disabled={!title.trim() || saving || selecting || unresolvedNewPlace}
        />
        <PlacesButton title={t('common.cancel')} secondary onPress={onCancel} disabled={saving} />
      </ScrollView>
    </View>
  );
}
