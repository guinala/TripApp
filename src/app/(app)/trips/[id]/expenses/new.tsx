import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronLeft, Calendar } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { dateLocale } from '@/i18n/date';

import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { CURRENCY_OPTIONS, CURRENCY_SYMBOL } from '@/constants/currencies';
import AuthTextField from '@/components/auth/AuthTextField';
import { SelectField, SelectOption } from '@/components/ui/SelectField';
import { CategorySelector } from '@/components/budget/CategorySelector';
import { ReceiptPicker, ReceiptAsset } from '@/components/budget/ReceiptPicker';
import { useTripStore } from '@/store/tripStore';
import { useAuthStore } from '@/store/authStore';
import { useExpenseStore } from '@/store/expenseStore';
import { useLiveConversion } from '@/hooks/use-live-conversion';
import { listDays } from '@/services/days';
import { uploadReceipt } from '@/services/receipts';
import { formatCurrency } from '@/utils/currency';
import type { Day } from '@/types/day';
import type { ExpenseCategory } from '@/types/expense';

function parseAmount(text: string): number {
  return parseFloat(text.replace(',', '.').replace(/[^0-9.]/g, ''));
}

export default function NewExpenseScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useTripStore((s) => s.trips.find((t) => t.id === id));
  const userId = useAuthStore((s) => s.user?.id);
  const addExpense = useExpenseStore((s) => s.addExpense);

  const tripCurrency = trip?.currency ?? 'EUR';

  const [amountText, setAmountText] = useState('');
  const [currency, setCurrency] = useState(tripCurrency);
  const [date, setDate] = useState(new Date());
  const [dayId, setDayId] = useState<string | null>(null);
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [description, setDescription] = useState('');
  const [receipt, setReceipt] = useState<ReceiptAsset | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDays(id)
      .then(setDays)
      .catch(() => setDays([]));
  }, [id]);

  const amount = parseAmount(amountText) || 0;
  const dateISO = format(date, 'yyyy-MM-dd');
  const conversion = useLiveConversion(amount, currency, tripCurrency, dateISO);

  const dayOptions: SelectOption[] = days.map((d) => ({
    label: t('itinerary.dayNumber', { number: d.dayNumber }),
    value: d.id,
  }));

  function handleDayChange(value: string) {
    setDayId(value);
    const day = days.find((d) => d.id === value);
    if (day) setDate(parseISO(day.date));
  }

  async function handleSave() {
    const value = parseAmount(amountText);
    if (!value || value <= 0) return setError(t('expense.errorAmount'));
    if (!category) return setError(t('expense.errorCategory'));
    setError(null);
    setSaving(true);
    try {
      let receiptPath: string | null = null;
      if (receipt && userId) {
        receiptPath = await uploadReceipt({ userId, tripId: id, base64: receipt.base64 });
      }
      await addExpense({
        tripId: id,
        dayId,
        amount: value,
        currency,
        category,
        description: description.trim() || null,
        date: dateISO,
        receiptPath,
      });
      router.back();
    } catch {
      setError(t('expense.errorSave'));
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={26} color={colors.secondary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('expense.title')}</Text>
        <Pressable onPress={handleSave} hitSlop={8} disabled={saving}>
          <Text style={styles.headerSave}>{t('common.save')}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Card IMPORTE */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>{t('expense.amount').toUpperCase()}</Text>
            <View style={styles.amountRow}>
              <TextInput
                style={styles.amountInput}
                value={amountText}
                onChangeText={setAmountText}
                keyboardType="decimal-pad"
                placeholder="0,00"
                placeholderTextColor="rgba(255,255,255,0.55)"
                autoFocus
              />
              <Text style={styles.amountSymbol}>{CURRENCY_SYMBOL[currency] ?? currency}</Text>
            </View>
            {conversion.converted != null ? (
              <Text style={styles.conversion}>
                ≈ {formatCurrency(conversion.converted, tripCurrency)}
                {conversion.rateDate
                  ? ` · ${t('expense.rateOf', {
                      date: format(parseISO(conversion.rateDate), 'd MMM', { locale: dateLocale() }),
                    })}`
                  : ''}
              </Text>
            ) : null}
          </View>

          <AuthTextField
            label={t('expense.description')}
            value={description}
            onChangeText={setDescription}
            placeholder={t('expense.descriptionPlaceholder')}
          />

          <View style={styles.row}>
            <View style={styles.flex}>
              <SelectField
                label={t('expense.currency')}
                value={currency}
                options={CURRENCY_OPTIONS}
                onChange={setCurrency}
              />
            </View>
            <View style={styles.flex}>
              <Text style={styles.fieldLabel}>{t('expense.date').toUpperCase()}</Text>
              <Pressable style={styles.dateBox} onPress={() => setShowPicker(true)}>
                <Calendar size={18} color={colors.textSecondary} />
                <Text style={styles.dateText}>
                  {format(date, 'd MMM yyyy', { locale: dateLocale() })}
                </Text>
              </Pressable>
            </View>
          </View>

          {dayOptions.length > 0 ? (
            <SelectField
              label={t('expense.tripDay')}
              value={dayId ?? ''}
              options={dayOptions}
              onChange={handleDayChange}
              placeholder={t('expense.selectDay')}
            />
          ) : null}

          <CategorySelector value={category} onChange={setCategory} />

          <ReceiptPicker value={receipt} onChange={setReceipt} />

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.submit, saving && styles.submitDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitText}>{t('budget.addExpense')}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {showPicker ? (
        <DateTimePicker
          value={date}
          mode="date"
          onChange={(_, selected) => {
            setShowPicker(Platform.OS === 'ios');
            if (selected) setDate(selected);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceCream },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
  },
  headerTitle: { fontFamily: fonts.sansBold, fontSize: fontSize.input, color: colors.secondary },
  headerSave: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.primary },
  content: { paddingHorizontal: spacing.s5, paddingBottom: 24, gap: 18 },
  amountCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: 25,
    paddingHorizontal: spacing.s5,
    alignItems: 'center',
    gap: spacing.s2,
  },
  amountLabel: {
    fontFamily: fonts.sansExtraBold,
    fontSize: fontSize.label,
    color: colors.surfacePaper,
  },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  amountInput: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.textMd,
    color: colors.white,
    minWidth: 80,
    textAlign: 'center',
    padding: 0,
  },
  amountSymbol: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.textMd,
    color: colors.white,
    paddingBottom: 2,
  },
  conversion: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.label,
    color: colors.textSubtitle,
  },
  fieldLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.label,
    letterSpacing: 0.8,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  row: { flexDirection: 'row', gap: spacing.s3 },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: '#ece2d4',
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateText: { fontFamily: fonts.sansMedium, fontSize: fontSize.input, color: colors.textPrimary },
  error: { fontFamily: fonts.sansMedium, fontSize: fontSize.sm, color: colors.danger },
  footer: { paddingHorizontal: spacing.s5, paddingTop: spacing.s2, paddingBottom: spacing.s4 },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.white },
});
