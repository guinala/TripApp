import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { DaySection } from '@/components/sections/DaySection';
import { useTripDetail } from '@/context/TripDetailContext';

export default function ItineraryScreen() {
  const { days, activities, selectedDayId, loading, error } = useTripDetail();

  const visibleDays = selectedDayId ? days.filter((d) => d.id === selectedDayId) : days;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {visibleDays.map((day) => (
        <DaySection
          key={day.id}
          day={day}
          activities={activities.filter((a) => a.dayId === day.id)}
        />
      ))}
    </ScrollView>
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
