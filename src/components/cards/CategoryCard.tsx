// src/components/budget/CategoryCard.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DonutSegment, DonutSegmentKey } from '@/hooks/use-budget-summary';
import { colors, expenseCategoryColors, fonts, remainingColor } from '@/constants/theme';
import { CategoryDonut } from '../budget/CategoryDonut';

const SEGMENT_LABELS: Record<DonutSegmentKey, string> = {
  stay: 'Aloj.',
  transport: 'Transp.',
  food: 'Comida',
  leisure: 'Ocio',
  other: 'Otros',
  remaining: 'Restante',
};

function colorFor(key: DonutSegmentKey): string {
  return key === 'remaining' ? remainingColor : expenseCategoryColors[key];
}

type CategoryCardProps = {
  segments: DonutSegment[];
};

export function CategoryCard({ segments }: CategoryCardProps) {
  const visible = segments.filter((s) => Math.round(s.percentage) >= 1);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>POR CATEGORÍA</Text>

      <View style={styles.chartWrap}>
        <CategoryDonut segments={segments} size={60} strokeWidth={12} />
      </View>

      <View style={styles.legend}>
        {visible.map((seg) => (
          <View key={seg.key} style={styles.row}>
            <View style={styles.data}>
              <View style={[styles.swatch, { backgroundColor: colorFor(seg.key) }]} />
              <Text style={styles.name} numberOfLines={1}>
                {SEGMENT_LABELS[seg.key]}
              </Text>
            </View>
            <Text style={styles.percent}>{Math.round(seg.percentage)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: colors.accent100,
    borderRadius: 16,
    paddingVertical: 10,
    gap: 10,
    overflow: 'hidden',
  },
  title: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 11,
    color: colors.textMetadata,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  chartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  legend: {
    paddingHorizontal: 30,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  data: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  swatch: {
    width: 15,
    height: 15,
    borderRadius: 4,
  },
  name: {
    fontFamily: fonts.sansBold,
    fontSize: 8,
    color: colors.textMetadata,
  },
  percent: {
    fontFamily: fonts.sansBold,
    fontSize: 8,
    color: colors.textPrimary,
  },
});
