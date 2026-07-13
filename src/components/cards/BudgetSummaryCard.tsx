import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/utils/currency';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import i18n from '@/i18n';

type BudgetSummaryCardProps = {
  spent: number;
  budget: number;
  percentage: number;
  remaining: number;
  dailyAverage: number;
  currency: string;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat(i18n.language === 'es' ? 'es-ES' : 'en-US', {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

export function BudgetSummaryCard({
  spent,
  budget,
  percentage,
  remaining,
  dailyAverage,
  currency,
}: BudgetSummaryCardProps) {
  const { t } = useTranslation();
  const filledPct = Math.min(Math.max(percentage, 0), 100);
  const overBudget = remaining < 0;

  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <Text style={styles.labelMeta}>{t('budget.totalSpent').toUpperCase()}</Text>
        <Text style={[styles.labelMeta, styles.percent]}>{Math.round(percentage)} %</Text>
      </View>

      <View style={styles.moneyRow}>
        <Text style={styles.amount}>{formatNumber(spent)}</Text>
        <Text style={styles.amountSub}> € / {formatNumber(budget)} €</Text>
      </View>

      <View style={styles.track}>
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${filledPct}%` }]}
        />
      </View>

      <View style={styles.labelRow}>
        <Text style={styles.labelMeta}>
          {overBudget ? `${t('budget.exceeded')} ` : `${t('budget.remaining')} `}
          <Text style={{ color: overBudget ? colors.primary : colors.accent }}>
            {formatCurrency(Math.abs(remaining), currency)}
          </Text>
        </Text>
        <Text style={styles.labelMeta}>
          {t('budget.dailyAverage')}:{' '}
          <Text style={styles.bold}>{formatCurrency(dailyAverage, currency)}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.secondaryDark,
    borderRadius: radius.xl,
    padding: 10,
    gap: 10,
    overflow: 'hidden',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelMeta: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.label,
    color: colors.textMetadata,
  },
  percent: {
    color: colors.accent,
    textAlign: 'right',
  },
  moneyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  amount: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.textMd,
    color: '#ffffff',
    lineHeight: 44,
  },
  amountSub: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.label,
    color: colors.secondary300,
    paddingBottom: 10,
  },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.secondary300,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  bold: {
    fontFamily: fonts.sansExtraBold,
  },
});
