import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import React from 'react';
import { useTripDetail } from '@/context/TripDetailContext';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';

function FilterButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
    >
      <Text style={[styles.label, active ? styles.labelActive : styles.labelIdle]}>{label}</Text>
    </Pressable>
  );
}

export default function DayFilter() {
  const { days, selectedDayId, setSelectedDayId } = useTripDetail();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <FilterButton
        label="Todo"
        active={selectedDayId === null}
        onPress={() => setSelectedDayId(null)}
      />
      {days.map((day) => (
        <FilterButton
          key={day.id}
          label={`D${day.dayNumber}`}
          active={selectedDayId === day.id}
          onPress={() => setSelectedDayId(day.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.s2, paddingHorizontal: spacing.s5, paddingVertical: spacing.s2 },
  chip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s1,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipIdle: { backgroundColor: colors.surfacePaper, borderColor: colors.secondary100 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: fontSize.label },
  labelActive: { color: colors.white },
  labelIdle: { color: colors.secondary300 },
});
