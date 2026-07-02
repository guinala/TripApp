import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import { useTripDetail } from '@/context/TripDetailContext';
import { usePackingStore, usePackingItems, usePackingLoading } from '@/store/packingStore';
import { PackingSection } from '@/components/PackingSection';
import { PackingProgressRing } from '@/components/PackingProgressRing';
import { PackingTemplatesSheet } from '@/components/PackingTemplatesSheet';
import { buildSeedsFromTemplates, type PackingTemplateKey } from '@/constants/packingTemplates';
import type { PackingCategory } from '@/types/packing';
import { Celebration } from '@/components/Celebration';

const CATEGORY_ORDER: PackingCategory[] = ['docs', 'clothes', 'tech', 'hygiene', 'other'];
const CATEGORY_LABEL: Record<PackingCategory, string> = {
  docs: 'Documentos',
  clothes: 'Ropa',
  tech: 'Tecnología',
  hygiene: 'Higiene',
  other: 'Otros',
};

function daysLabel(startISO: string): string {
  const diff = differenceInCalendarDays(parseISO(startISO), new Date());
  if (diff > 1) return `Quedan ${diff} días para el viaje`;
  if (diff === 1) return 'Queda 1 día para el viaje';
  if (diff === 0) return 'El viaje es hoy';
  return 'Viaje en curso';
}

export default function PackingScreen() {
  const { trip } = useTripDetail();
  const tripId = trip.id;

  const items = usePackingItems(tripId);
  const loading = usePackingLoading(tripId);
  const fetchItems = usePackingStore((s) => s.fetchItems);
  const toggle = usePackingStore((s) => s.toggle);
  const addItem = usePackingStore((s) => s.addItem);
  const addItems = usePackingStore((s) => s.addItems);
  const removeItem = usePackingStore((s) => s.removeItem);
  const editItem = usePackingStore((s) => s.editItem);
  const replaceItems = usePackingStore((s) => s.replaceItems);

  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchItems(tripId);
  }, [tripId, fetchItems]);

  const done = items.filter((i) => i.checked).length;

  const allDone = items.length > 0 && done === items.length;
  const [celebrationId, setCelebrationId] = useState(0);
  const initialized = useRef(false);
  const prevAllDone = useRef(false);

  useEffect(() => {
    if (items.length === 0) {
      initialized.current = false;
      prevAllDone.current = false;
      return;
    }
    if (!initialized.current) {
      initialized.current = true;
      prevAllDone.current = allDone;
      return;
    }
    if (allDone && !prevAllDone.current) {
      setCelebrationId((n) => n + 1);
    }
    prevAllDone.current = allDone;
  }, [items.length, allDone]);

  const sections = useMemo(
    () =>
      CATEGORY_ORDER.map((cat) => ({
        category: cat,
        label: CATEGORY_LABEL[cat],
        data: items.filter((i) => i.category === cat),
      })).filter((s) => s.data.length > 0),
    [items],
  );

  const handleToggle = (id: string, next: boolean) => {
    toggle(tripId, id, next).catch(() => Alert.alert('No se pudo guardar', 'Inténtalo de nuevo.'));
  };

  const handleAdd = (category: PackingCategory, name: string) => {
    addItem(tripId, { name, category }).catch(() =>
      Alert.alert('No se pudo añadir', 'Inténtalo de nuevo.'),
    );
  };

  const handleApplyTemplates = (keys: PackingTemplateKey[]) => {
    setTemplatesOpen(false);
    const seeds = buildSeedsFromTemplates(keys);
    if (seeds.length === 0) return;

    if (items.length === 0) {
      addItems(tripId, seeds).catch(() => Alert.alert('No se pudo aplicar', 'Inténtalo de nuevo.'));
      return;
    }

    Alert.alert('Ya tienes equipaje', '¿Quieres añadirlo a tu lista o reemplazarla?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Añadir',
        onPress: () => {
          const existing = new Set(items.map((i) => i.name.trim().toLowerCase()));
          const fresh = seeds.filter((s) => !existing.has(s.name.trim().toLowerCase()));
          if (fresh.length === 0) return;
          addItems(tripId, fresh).catch(() =>
            Alert.alert('No se pudo añadir', 'Inténtalo de nuevo.'),
          );
        },
      },
      {
        text: 'Reemplazar',
        style: 'destructive',
        onPress: () =>
          replaceItems(tripId, seeds).catch(() =>
            Alert.alert('No se pudo reemplazar', 'Inténtalo de nuevo.'),
          ),
      },
    ]);
  };

  const handleLongPress = (item: { id: string; name: string }) => {
    Alert.alert(item.name, undefined, [
      { text: 'Editar', onPress: () => setEditingId(item.id) },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () =>
          removeItem(tripId, item.id).catch(() =>
            Alert.alert('No se pudo eliminar', 'Inténtalo de nuevo.'),
          ),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleSubmitEdit = (id: string, name: string) => {
    setEditingId(null);
    editItem(tripId, id, { name }).catch(() =>
      Alert.alert('No se pudo guardar', 'Inténtalo de nuevo.'),
    );
  };

  return (
    <View style={styles.screen}>
      {loading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Tu maleta está vacía</Text>
          <Text style={styles.emptyText}>
            Empieza con una plantilla o añade lo que necesites llevar.
          </Text>
          <Pressable style={styles.emptyBtn} onPress={() => setTemplatesOpen(true)}>
            <Text style={styles.emptyBtnText}>Cargar plantilla</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.datos}>
            <View style={styles.chartGroup}>
              <PackingProgressRing done={done} total={items.length} />
              <View style={styles.amount}>
                <View style={styles.info}>
                  <Text style={styles.count}>
                    {done} de {items.length}
                  </Text>
                  <Text style={styles.prepared}>preparados</Text>
                </View>
                <Text style={styles.daysText}>{daysLabel(trip.startDate)}</Text>
              </View>
            </View>

            <Pressable
              style={styles.templatesBtn}
              onPress={() => setTemplatesOpen(true)}
              hitSlop={8}
            >
              <Text style={styles.templatesText}>Plantillas</Text>
            </Pressable>
          </View>

          <View style={styles.sections}>
            {sections.map((s) => (
              <PackingSection
                key={s.category}
                title={s.label}
                items={s.data}
                onToggle={handleToggle}
                onAddItem={(name) => handleAdd(s.category, name)}
                onLongPressItem={handleLongPress}
                editingId={editingId}
                onSubmitEdit={handleSubmitEdit}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}
          </View>
        </ScrollView>
      )}

      <PackingTemplatesSheet
        visible={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onApply={handleApplyTemplates}
      />
      {celebrationId > 0 && <Celebration key={celebrationId} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceCream },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  content: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 120, gap: 20 },

  datos: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amount: { width: 104, gap: 5 },
  info: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { fontFamily: fonts.serifItalic, fontSize: fontSize.title, color: colors.secondaryDark },
  prepared: { fontFamily: fonts.serifItalic, fontSize: fontSize.label, color: colors.textSubtitle },
  daysText: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.nano,
    color: colors.secondary300,
    letterSpacing: 0.2,
  },

  templatesBtn: {
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: colors.textSubtitle,
    borderRadius: radius.lg,
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  templatesText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.micro,
    color: colors.secondary,
  },

  sections: { gap: 20 },

  emptyTitle: { fontFamily: fonts.serifItalic, fontSize: fontSize.title, color: colors.secondary },
  emptyText: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.sm,
    color: colors.secondary300,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.white },
});
