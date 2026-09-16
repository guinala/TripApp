import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import { PlacesStatus } from '@/components/explore/PlacesStatus';
import { DaySection } from '@/components/sections/DaySection';
import { useTripDetail } from '@/context/TripDetailContext';
import { useState } from 'react';
import { AddActivityModal } from '@/components/itinerary/AddActivityModal';
import { NestableScrollContainer } from 'react-native-reanimated-drag-list';
import type { Activity } from '@/types/activity';

export default function ItineraryScreen() {
  const { days, activities, selectedDayId, loading, error, reload, reorder } = useTripDetail();
  const [targetDayId, setTargetDayId] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  if (error)
    return (
      <View style={styles.centered}>
        <PlacesStatus error={error} onRetry={reload} />
      </View>
    );

  const visibleDays = selectedDayId ? days.filter((d) => d.id === selectedDayId) : days;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceCream }}>
      <NestableScrollContainer contentContainerStyle={styles.content}>
        {visibleDays.map((day) => (
          <DaySection
            key={day.id}
            day={day}
            activities={activities.filter((a) => a.dayId === day.id)}
            onAddActivity={setTargetDayId}
            onEditActivity={(activity) => {
              setEditingActivity(activity);
              setTargetDayId(activity.dayId);
            }}
            onReorder={reorder}
          />
        ))}
      </NestableScrollContainer>
      <AddActivityModal
        key={`${editingActivity?.id ?? 'new'}-${targetDayId ?? 'closed'}`}
        dayId={targetDayId}
        activity={editingActivity}
        onClose={() => {
          setTargetDayId(null);
          setEditingActivity(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.surfaceCream },
  content: { paddingVertical: spacing.s5, gap: spacing.s7 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceCream,
  },
});
