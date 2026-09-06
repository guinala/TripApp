import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';

export function TimeField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);

  const toDate = (hhmm: string | null) => {
    const d = new Date();
    if (hhmm) {
      const [h, m] = hhmm.split(':').map(Number);
      d.setHours(h, m, 0, 0);
    }
    return d;
  };

  const onChangePicker = (e: DateTimePickerEvent, date?: Date) => {
    setShow(Platform.OS === 'ios'); // Android se cierra solo al elegir
    if (e.type === 'set' && date) {
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      onChange(`${hh}:${mm}`);
    }
  };

  return (
    <>
      <Pressable style={styles.field} onPress={() => setShow(true)}>
        <Ionicons name="time-outline" size={20} color={colors.secondary300} />
        <Text style={[styles.text, !value && { color: colors.secondary300 }]}>
          {value ?? '--:--'}
        </Text>
      </Pressable>
      {show ? (
        <DateTimePicker value={toDate(value)} mode="time" is24Hour onChange={onChangePicker} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: colors.textSubtitle,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s4,
  },
  text: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.base,
    color: colors.secondary,
  },
});
