// src/components/budget/CategorySelector.tsx
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, expenseCategoryColors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { EXPENSE_ICON } from '@/constants/expenseIcons';
import type { ExpenseCategory } from '@/types/expense';

const CATEGORIES: { key: ExpenseCategory; labelKey: string }[] = [
  { key: 'food', labelKey: 'budget.categoriesFull.food' },
  { key: 'transport', labelKey: 'budget.categoriesFull.transport' },
  { key: 'stay', labelKey: 'budget.categoriesFull.stay' },
  { key: 'leisure', labelKey: 'budget.categoriesFull.leisure' },
  { key: 'other', labelKey: 'budget.categoriesFull.other' },
];

interface Props {
  value: ExpenseCategory | null;
  onChange: (c: ExpenseCategory) => void;
}

export function CategorySelector({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('budget.category').toUpperCase()}</Text>
      <View style={styles.grid}>
        {CATEGORIES.map((c) => {
          const tint = expenseCategoryColors[c.key];
          const active = value === c.key;
          return (
            <Pressable
              key={c.key}
              style={[styles.item, active && { borderColor: tint, backgroundColor: `${tint}1A` }]}
              onPress={() => onChange(c.key)}
            >
              <Ionicons name={EXPENSE_ICON[c.key]} size={22} color={tint} />
              <Text style={[styles.itemLabel, active && { color: tint }]} numberOfLines={1}>
                {t(c.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.s2 },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.label,
    letterSpacing: 0.8,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  grid: { flexDirection: 'row', gap: spacing.s2 },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.s1,
    paddingVertical: spacing.s3,
    paddingHorizontal: 4,
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: '#ece2d4',
    borderRadius: radius.md,
  },
  itemLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.nano,
    color: colors.textSecondary,
  },
});
