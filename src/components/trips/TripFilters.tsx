import { Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, radius } from '@/constants/theme';

export type TripFilter = 'all' | 'planned' | 'active' | 'completed';

const FILTERS: { key: TripFilter; labelKey: string }[] = [
  { key: 'all', labelKey: 'trips.filters.all' },
  { key: 'planned', labelKey: 'trips.filters.planned' },
  { key: 'active', labelKey: 'trips.filters.active' },
  { key: 'completed', labelKey: 'trips.filters.completed' },
];

type TripFiltersProps = {
  active: TripFilter;
  total: number;
  onChange: (f: TripFilter) => void;
};

export default function TripFilters({ active, total, onChange }: TripFiltersProps) {
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      style={styles.scroll}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {FILTERS.map(({ key, labelKey }) => {
        const selected = active === key;

        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[styles.pill, selected ? styles.pillActive : styles.pillInactive]}
          >
            <Text
              style={[styles.label, selected ? styles.labelActive : styles.labelInactive]}
              numberOfLines={1}
            >
              {t(labelKey)}
              {key === 'all' ? ` · ${total}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, height: 48, overflow: 'visible' },
  row: { gap: 10, paddingVertical: 4, paddingRight: 4 },
  pill: {
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pillActive: { backgroundColor: colors.secondaryDark },
  pillInactive: { borderWidth: 1, borderColor: colors.secondary300 },
  label: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, lineHeight: 18, flexShrink: 0 },
  labelActive: { color: colors.surfacePaper },
  labelInactive: { color: colors.secondary },
});
