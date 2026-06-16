import { View, Text, Alert, StyleSheet, Platform, Pressable } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTripStore } from '@/store/tripStore';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import DateTimePicker from '@react-native-community/datetimepicker';
import { es } from 'date-fns/locale';
import { TripType } from '@/types/trip';
import { CurrencySelect } from '@/components/CurrencySelect';
import { TripTypeSelector } from '@/components/TripTypeSelector';

function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function NewTripScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addTrip = useTripStore((s) => s.addTrip);

  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [currency, setCurrency] = useState('EUR');
  const [budget, setBudget] = useState('');
  const [picker, setPicker] = useState<'start' | 'end' | null>(null);
  const [saving, setSaving] = useState(false);
  const [tripType, setTripType] = useState<TripType | null>(null);

  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  const editTrip = useTripStore((s) => s.editTrip);

  const nights = startDate && endDate ? differenceInCalendarDays(endDate, startDate) + 1 : 0;

  useEffect(() => {
    if (!id) return;
    const t = useTripStore.getState().trips.find((x) => x.id === id);
    if (!t) return;
    setTitle(t.title);
    setDestination(t.destination);
    setStartDate(parseISO(t.startDate));
    setEndDate(parseISO(t.endDate));
    setCurrency(t.currency);
    setBudget(t.budget != null ? String(t.budget) : '');
    setTripType(t.tripType);
  }, [id]);

  const onChangeDate = (_event: unknown, selected?: Date) => {
    const which = picker;
    setPicker(null); // en Android el picker se cierra solo al elegir
    if (!selected || !which) return;
    if (which === 'start') {
      setStartDate(selected);
      if (endDate && selected > endDate) setEndDate(null);
    } else {
      setEndDate(selected);
    }
  };

  const handleSubmit = async () => {
    if (!destination.trim()) return Alert.alert('Falta el destino', 'Indica a dónde viajas.');
    if (!startDate || !endDate) return Alert.alert('Faltan fechas', 'Elige inicio y fin.');
    if (endDate < startDate)
      return Alert.alert('Fechas inválidas', 'El fin no puede ser antes del inicio.');

    const budgetNum = budget ? Number(budget.replace(',', '.')) : null;
    if (budgetNum !== null && (Number.isNaN(budgetNum) || budgetNum < 0)) {
      return Alert.alert('Presupuesto inválido', 'Introduce un número válido.');
    }

    setSaving(true);
    try {
      await addTrip({
        title: title.trim() || `Viaje a ${destination.trim()}`,
        destination: destination.trim(),
        startDate: toISODate(startDate),
        endDate: toISODate(endDate),
        currency,
        budget: budgetNum,
        coverImage: null,
        tripType,
      });
      router.back();
    } catch (e) {
      Alert.alert('No se pudo crear', (e as Error).message);
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.secondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Nuevo Viaje</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>NOMBRE DEL VIAJE</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Japón en Octubre"
          placeholderTextColor={colors.textMetadata}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>DESTINO</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Tokio, Japón"
          placeholderTextColor={colors.textMetadata}
          value={destination}
          onChangeText={setDestination}
        />

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>INICIO</Text>
            <Pressable style={styles.input} onPress={() => setPicker('start')}>
              <Ionicons name="calendar-outline" size={16} color={colors.secondary300} />
              <Text style={styles.dateText}>
                {startDate ? format(startDate, 'd MMM', { locale: es }) : 'Elegir'}
              </Text>
            </Pressable>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>FIN</Text>
            <Pressable style={styles.input} onPress={() => setPicker('end')}>
              <Ionicons name="calendar-outline" size={16} color={colors.secondary300} />
              <Text style={styles.dateText}>
                {endDate ? format(endDate, 'd MMM', { locale: es }) : 'Elegir'}
              </Text>
            </Pressable>
          </View>
        </View>
        {nights > 0 && (
          <Text style={styles.hint}>
            + {nights} días · {format(startDate!, 'yyyy')}
          </Text>
        )}

        <Text style={styles.label}>MONEDA</Text>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>MONEDA</Text>
            <CurrencySelect value={currency} onChange={setCurrency} />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>PRESUPUESTO</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textMetadata}
              keyboardType="decimal-pad"
              value={budget}
              onChangeText={setBudget}
            />
          </View>
        </View>

        <Text style={styles.label}>TIPO DE VIAJE</Text>
        <TripTypeSelector value={tripType} onChange={setTripType} />

        <Text style={styles.label}>PRESUPUESTO (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor={colors.textMetadata}
          keyboardType="decimal-pad"
          value={budget}
          onChangeText={setBudget}
        />
      </ScrollView>

      <Pressable
        style={[styles.submit, { marginBottom: insets.bottom + 10 }, saving && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={saving}
      >
        <Ionicons name="add" size={20} color={colors.surfacePaper} />
        <Text style={styles.submitLabel}>{saving ? 'Creando…' : 'Crear viaje'}</Text>
      </Pressable>

      {picker && (
        <DateTimePicker
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          value={(picker === 'start' ? startDate : endDate) ?? new Date()}
          minimumDate={picker === 'end' && startDate ? startDate : undefined}
          onChange={onChangeDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfacePaper, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: fonts.sansBold, fontSize: fontSize.input, color: colors.secondary },
  body: { gap: 8, paddingBottom: 20 },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.label,
    color: colors.primary,
    marginTop: 8,
    letterSpacing: 0.3,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.secondary100,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.base,
    color: colors.secondary,
  },
  dateText: { fontFamily: fonts.sansRegular, fontSize: fontSize.base, color: colors.secondary },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  hint: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.label,
    color: colors.primary,
    marginTop: 2,
  },
  currencyText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.textSecondary },
  currencyTextActive: { color: colors.surfacePaper },
  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
  },
  submitLabel: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.surfacePaper },
});
