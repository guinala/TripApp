import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, radius } from '@/constants/theme';

export const CURRENCIES = [
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'MXN', symbol: '$' },
];

interface CurrencySelectProps {
  value: string;
  onChange: (code: string) => void;
}

export function CurrencySelect({ value, onChange }: CurrencySelectProps) {
  const [open, setOpen] = useState(false);
  const selected = CURRENCIES.find((c) => c.code === value);

  return (
    <>
      <Pressable style={styles.box} onPress={() => setOpen(true)}>
        <Text style={styles.boxText}>
          {selected ? `${selected.code} (${selected.symbol})` : 'Elegir'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.secondary300} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {CURRENCIES.map((c) => {
              const active = c.code === value;
              return (
                <Pressable
                  key={c.code}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => {
                    onChange(c.code);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {c.code} ({c.symbol})
                  </Text>
                  {active && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.secondary100,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  boxText: { fontFamily: fonts.sansRegular, fontSize: fontSize.base, color: colors.secondary },
  overlay: { flex: 1, backgroundColor: 'rgba(15,27,51,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surfacePaper,
    borderTopLeftRadius: radius.xl2,
    borderTopRightRadius: radius.xl2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    paddingBottom: 32,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  optionActive: { backgroundColor: colors.primary50 },
  optionText: { fontFamily: fonts.sansMedium, fontSize: fontSize.input, color: colors.secondary },
  optionTextActive: { fontFamily: fonts.sansBold, color: colors.primary },
});
