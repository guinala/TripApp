import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import { PACKING_TEMPLATES, type PackingTemplateKey } from '@/constants/packingTemplates';

const TEMPLATE_KEYS = Object.keys(PACKING_TEMPLATES) as PackingTemplateKey[];

type PackingTemplatesSheetProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (keys: PackingTemplateKey[]) => void;
};

export function PackingTemplatesSheet({ visible, onClose, onApply }: PackingTemplatesSheetProps) {
  const [selected, setSelected] = useState<PackingTemplateKey[]>([]);

  const toggle = (key: PackingTemplateKey) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const close = () => {
    setSelected([]);
    onClose();
  };

  const apply = () => {
    if (selected.length === 0) return;
    onApply(selected);
    setSelected([]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        {/* onPress vacío: absorbe el toque para que no cierre al tocar la hoja */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Plantillas</Text>
          <Text style={styles.subtitle}>Elige qué añadir a tu maleta</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {TEMPLATE_KEYS.map((key) => {
              const tpl = PACKING_TEMPLATES[key];
              const isSelected = selected.includes(key);
              return (
                <Pressable key={key} style={styles.option} onPress={() => toggle(key)}>
                  <View style={styles.optionText}>
                    <Text style={styles.optionName}>{tpl.name}</Text>
                    <Text style={styles.optionCount}>{tpl.items.length} ítems</Text>
                  </View>
                  {isSelected ? <Check size={20} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            style={[styles.applyBtn, selected.length === 0 && styles.applyDisabled]}
            onPress={apply}
            disabled={selected.length === 0}
          >
            <Text style={styles.applyText}>
              Aplicar{selected.length > 0 ? ` (${selected.length})` : ''}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 51, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surfacePaper,
    borderTopLeftRadius: radius.xl2,
    borderTopRightRadius: radius.xl2,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  title: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.title,
    color: colors.secondary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.sm,
    color: colors.secondary300,
    marginBottom: 12,
  },
  list: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceAlt,
  },
  optionText: { gap: 2 },
  optionName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.input,
    color: colors.textPrimary,
  },
  optionCount: { fontFamily: fonts.sansRegular, fontSize: fontSize.sm, color: colors.secondary300 },
  applyBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyDisabled: { opacity: 0.6 },
  applyText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.white },
});
