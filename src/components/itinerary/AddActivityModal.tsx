import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTripDetail } from '@/context/TripDetailContext';
import type { Activity } from '@/types/activity';
import { ActivityForm } from './ActivityForm';
import { ui } from '@/components/explore/PlacesUI';

export function AddActivityModal({
  dayId,
  activity = null,
  onClose,
}: {
  dayId: string | null;
  activity?: Activity | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { trip, days, addActivity, updateActivity, removeActivity, destinationResolution } =
    useTripDetail();
  const [saving, setSaving] = useState(false);
  const day = days.find((d) => d.id === dayId);

  return (
    <Modal
      visible={!!dayId}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={() => {
        if (!saving) onClose();
      }}
    >
      <SafeAreaView style={ui.screen}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Text style={[ui.title, { padding: 20 }]}>
            {t(activity ? 'itinerary.editActivity' : 'itinerary.newActivity')}
            {day ? ` · ${t('itinerary.dayFilter.day', { number: day.dayNumber })}` : ''}
          </Text>
          {dayId && (
            <ActivityForm
              key={`${dayId}:${activity?.id ?? 'new'}`}
              dayId={dayId}
              currency={trip.currency}
              activity={activity}
              center={destinationResolution.place?.location ?? undefined}
              onSavingChange={setSaving}
              onCancel={onClose}
              onDelete={
                activity
                  ? async () => {
                      await removeActivity(activity.id);
                      onClose();
                    }
                  : undefined
              }
              onSubmit={async (input) => {
                if (activity) await updateActivity(activity.id, input);
                else await addActivity(input);
                onClose();
              }}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
