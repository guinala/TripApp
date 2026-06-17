import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import React from 'react';
import { colors, fonts, fontSize, radius } from '@/constants/theme';

export type TripFilter = 'all' | 'planned' | 'active' | 'completed';

const FILTERS: { key: TripFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'planned', label: 'Próximos' },
  { key: 'active', label: 'En Curso' },
  { key: 'completed', label: 'Pasados' },
];

type TripFiltersProps = {
  active: TripFilter;
  total: number;
  onChange: (f: TripFilter) => void;
};

export default function TripFilters({ active, total, onChange }: TripFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {FILTERS.map(({ key, label }) => {
        const selected = active === key;

        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[styles.pill, selected ? styles.pillActive : styles.pillInactive]}
          >
            <Text>
              {label}
              {key === 'all' ? ` · ${total}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10, paddingVertical: 4 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: colors.secondaryDark },
  pillInactive: { borderWidth: 1, borderColor: colors.secondary300 },
  label: { fontFamily: fonts.sansBold, fontSize: fontSize.base },
});
