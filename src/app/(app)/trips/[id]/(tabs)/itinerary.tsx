import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { DaySection } from '@/components/sections/DaySection';
import { useTripDetail } from '@/context/TripDetailContext';
import { useState } from 'react';
import { AddActivityModal } from '@/components/AddActivityModal';
import { NestableScrollContainer } from 'react-native-reanimated-drag-list';

export default function ItineraryScreen() {
  const { days, activities, selectedDayId, loading, error, reorder } = useTripDetail();
  const [targetDayId, setTargetDayId] = useState<string | null>(null);

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  if (error)
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
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
            onReorder={reorder}
          />
        ))}
      </NestableScrollContainer>
      <AddActivityModal dayId={targetDayId} onClose={() => setTargetDayId(null)} />
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
  error: { fontFamily: fonts.sansRegular, fontSize: fontSize.body, color: colors.danger },
});
