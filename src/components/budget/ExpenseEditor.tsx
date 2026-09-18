import { useRef, useState } from 'react';
import { Alert, Linking, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { format, isValid, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import type { Trip } from '@/types/trip';
import type { Day } from '@/types/day';
import type { Expense, ExpenseCategory } from '@/types/expense';
import { useExpenseStore } from '@/store/expenseStore';
import { PlacesButton, ui } from '@/components/explore/PlacesUI';
import { LoadNotice } from '@/components/ui/LoadNotice';
import { SelectField } from '@/components/ui/SelectField';
import { CategorySelector } from './CategorySelector';
import { ReceiptPicker, type ReceiptAsset } from './ReceiptPicker';
import { CURRENCY_OPTIONS } from '@/constants/currencies';
import { parseAmount } from '@/utils/parseAmount';
import { formatCurrency } from '@/utils/currency';
import { uploadReceipt, getReceiptUrl } from '@/services/receipts';
import { accountOwner, accountVersion, assertAccount } from '@/services/account-session';
import { useLiveConversion } from '@/hooks/use-live-conversion';

export function ExpenseEditor({
  trip,
  days,
  expense,
}: {
  trip: Trip;
  days: Day[];
  expense?: Expense;
}) {
  const { t, i18n } = useTranslation();
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [currency, setCurrency] = useState(expense?.currency ?? trip.currency);
  const [date, setDate] = useState(expense?.date ?? format(new Date(), 'yyyy-MM-dd'));
  const [dayId, setDayId] = useState(expense?.dayId ?? '');
  const [category, setCategory] = useState<ExpenseCategory | null>(expense?.category ?? null);
  const [description, setDescription] = useState(expense?.description ?? '');
  const [receipt, setReceipt] = useState<ReceiptAsset | null>(null);
  const [removedReceipt, setRemovedReceipt] = useState(false);
  const uploaded = useRef<{ asset: ReceiptAsset; path: string } | null>(null);
  const locked = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const value = parseAmount(amount);
  const conversion = useLiveConversion(value ?? 0, currency, trip.currency, date);
  const originalReceipt = !removedReceipt ? expense?.receiptPath : null;
  const leave = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/trips/[id]/expenses', params: { id: trip.id } });

  async function save() {
    if (locked.current) return;
    if (value === null || value <= 0) {
      setError(t('expense.errorAmount'));
      return;
    }
    if (!category) {
      setError(t('expense.errorCategory'));
      return;
    }
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !isValid(parseISO(date)) ||
      format(parseISO(date), 'yyyy-MM-dd') !== date
    ) {
      setError(t('fixes.invalidDate'));
      return;
    }
    const started = accountVersion();
    locked.current = true;
    setSaving(true);
    setError(null);
    try {
      assertAccount(started);
      let receiptPath = originalReceipt ?? null;
      if (receipt) {
        if (uploaded.current?.asset !== receipt) {
          const path = await uploadReceipt({
            userId: accountOwner()!,
            tripId: trip.id,
            base64: receipt.base64,
          });
          assertAccount(started);
          uploaded.current = { asset: receipt, path };
        }
        receiptPath = uploaded.current!.path;
      }
      const input = {
        amount: value,
        currency,
        date,
        dayId: dayId || null,
        category,
        description: description.trim() || null,
        receiptPath,
      };
      assertAccount(started);
      if (expense) await useExpenseStore.getState().editExpense(trip.id, expense.id, input);
      else await useExpenseStore.getState().addExpense({ ...input, tripId: trip.id });
      assertAccount(started);
      leave();
    } catch {
      setError(t('expense.errorSave'));
    } finally {
      locked.current = false;
      setSaving(false);
    }
  }

  async function remove() {
    if (!expense || locked.current) return;
    const started = accountVersion();
    locked.current = true;
    setSaving(true);
    setError(null);
    try {
      await useExpenseStore.getState().removeExpense(trip.id, expense.id);
      assertAccount(started);
      leave();
    } catch {
      setError(t('errors.deleteExpense'));
    } finally {
      locked.current = false;
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(t('common.delete'), t('fixes.deleteExpenseConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => void remove() },
    ]);
  }

  return (
    <View style={{ gap: 16 }}>
      <Text style={ui.text}>{t('expense.amount')}</Text>
      <TextInput
        accessibilityLabel={t('expense.amount')}
        style={ui.input}
        value={amount}
        onChangeText={setAmount}
        editable={!saving}
        keyboardType="decimal-pad"
        placeholder="12,50"
      />
      <SelectField
        label={t('expense.currency')}
        value={currency}
        options={CURRENCY_OPTIONS}
        onChange={setCurrency}
      />
      <Text style={ui.text}>{t('expense.date')} · YYYY-MM-DD</Text>
      <TextInput
        accessibilityLabel={t('expense.date')}
        style={ui.input}
        value={date}
        editable={!saving}
        onChangeText={(next) => {
          setDate(next);
          if (days.find((day) => day.id === dayId)?.date !== next) setDayId('');
        }}
        placeholder="2026-09-16"
      />
      <SelectField
        label={t('expense.tripDay')}
        value={dayId}
        options={[
          { value: '', label: t('fixes.unassigned') },
          ...days.map((day) => ({
            value: day.id,
            label: t('itinerary.dayNumber', { number: day.dayNumber }),
          })),
        ]}
        onChange={(next) => {
          setDayId(next);
          const day = days.find((day) => day.id === next);
          if (day) setDate(day.date);
        }}
      />
      <CategorySelector value={category} onChange={setCategory} />
      <Text style={ui.text}>{t('expense.description')}</Text>
      <TextInput
        accessibilityLabel={t('expense.description')}
        style={ui.input}
        value={description}
        onChangeText={setDescription}
        editable={!saving}
      />
      <ReceiptPicker
        value={receipt}
        onChange={(asset) => {
          setReceipt(asset);
          if (asset) setRemovedReceipt(false);
        }}
      />
      {originalReceipt && !receipt && (
        <PlacesButton
          secondary
          title={t('fixes.openReceipt')}
          onPress={() => {
            void getReceiptUrl(originalReceipt)
              .then((url) => Linking.openURL(url))
              .catch(() => setError(t('fixes.loadError')));
          }}
        />
      )}
      {(originalReceipt || receipt) && (
        <PlacesButton
          secondary
          title={t('fixes.removeReceipt')}
          disabled={saving}
          onPress={() => {
            setReceipt(null);
            setRemovedReceipt(true);
          }}
        />
      )}
      <LoadNotice
        loading={conversion.loading}
        error={conversion.error}
        message={conversion.error ? t('fixes.rateError') : undefined}
        onRetry={conversion.retry}
      />
      {conversion.converted !== null && (
        <Text style={ui.text}>
          ≈ {formatCurrency(conversion.converted, trip.currency, i18n.language)} ·{' '}
          {t('expense.rateOf', { date: conversion.rateDate })}
        </Text>
      )}
      <Text style={ui.text}>{t('fixes.ratePolicy')}</Text>
      {error && <LoadNotice error message={error} />}
      <PlacesButton
        title={t(saving ? 'fixes.saving' : 'common.save')}
        disabled={saving}
        onPress={() => void save()}
      />
      {expense && (
        <PlacesButton
          secondary
          title={t('common.delete')}
          disabled={saving}
          onPress={confirmDelete}
        />
      )}
      <PlacesButton secondary title={t('common.cancel')} disabled={saving} onPress={leave} />
    </View>
  );
}
