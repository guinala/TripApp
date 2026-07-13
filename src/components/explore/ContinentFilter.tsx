import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { CONTINENTS } from '@/constants/destinations';
import type { Continent } from '@/types/destination';

type ContinentFilterProps = {
  value: Continent | null;
  onChange: (value: Continent | null) => void;
};

export function ContinentFilter({ value, onChange }: ContinentFilterProps) {
  const { t } = useTranslation();
  const options: { key: string; label: string; continent: Continent | null }[] = [
    { key: 'all', label: t('explore.filters.all'), continent: null },
    ...CONTINENTS.map((c) => ({ key: c, label: c, continent: c as Continent | null })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((opt) => {
        const active = value === opt.continent;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.continent)}
            style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
          >
            <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.s2,
    paddingRight: spacing.s5,
  },
  chip: {
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: spacing.s2,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: colors.secondaryDark,
    borderColor: colors.secondaryDark,
  },
  chipInactive: {
    backgroundColor: colors.surfacePaper,
    borderColor: colors.secondary300,
  },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.base,
  },
  labelActive: {
    color: colors.surfacePaper,
  },
  labelInactive: {
    color: colors.textSecondary,
  },
});
