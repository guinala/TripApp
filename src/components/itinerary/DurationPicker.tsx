import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';

type DurationPickerProps = {
  value: number | null;
  onChange: (minutes: number | null) => void;
};

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const VERTICAL_PADDING = ((VISIBLE_ITEMS - 1) / 2) * ITEM_HEIGHT;

const HOURS = Array.from({ length: 13 }, (_, index) => index);

const MINUTES = Array.from({ length: 60 }, (_, index) => index);

const PRESETS = [
  { label: '30 min', value: 30 },
  { label: '1 h', value: 60 },
  { label: '1 h 30', value: 90 },
  { label: '2 h', value: 120 },
  { label: '3 h', value: 180 },
  { label: '½ día', value: 240 },
];

function getHours(minutes: number | null) {
  if (!minutes || minutes <= 0) {
    return 0;
  }

  return Math.floor(minutes / 60);
}

function getMinutePart(minutes: number | null) {
  if (!minutes || minutes <= 0) {
    return 0;
  }

  return minutes % 60;
}

function formatDuration(minutes: number | null) {
  if (!minutes || minutes <= 0) {
    return 'Sin duración';
  }

  const hours = Math.floor(minutes / 60);
  const minutePart = minutes % 60;

  if (hours === 0) {
    return `${minutePart} min`;
  }

  if (minutePart === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutePart} min`;
}

function WheelColumn({
  values,
  selectedIndex,
  onChange,
  renderValue,
}: {
  values: number[];
  selectedIndex: number;
  onChange: (index: number) => void;
  renderValue: (value: number) => string;
}) {
  const listRef = useRef<FlatList<number>>(null);

  useEffect(() => {
    listRef.current?.scrollToOffset({
      offset: selectedIndex * ITEM_HEIGHT,
      animated: false,
    });
  }, [selectedIndex]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    const index = Math.round(offsetY / ITEM_HEIGHT);

    const clampedIndex = Math.max(0, Math.min(index, values.length - 1));

    onChange(clampedIndex);
  };

  return (
    <View style={styles.wheelContainer}>
      <View style={styles.selectionHighlight} />

      <FlatList
        ref={listRef}
        data={values}
        keyExtractor={(item, index) => `${item}-${index}`}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        contentContainerStyle={{
          paddingVertical: VERTICAL_PADDING,
        }}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item, index }) => {
          const active = index === selectedIndex;

          return (
            <View style={styles.wheelItem}>
              <Text style={[styles.wheelText, active && styles.wheelTextActive]}>
                {renderValue(item)}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

export function DurationPicker({ value, onChange }: DurationPickerProps) {
  const [visible, setVisible] = useState(false);

  const [hours, setHours] = useState(getHours(value));

  const [minutePart, setMinutePart] = useState(getMinutePart(value));

  const selectedHourIndex = useMemo(() => Math.max(0, HOURS.indexOf(hours)), [hours]);

  const selectedMinuteIndex = useMemo(() => Math.max(0, MINUTES.indexOf(minutePart)), [minutePart]);

  const open = () => {
    setHours(getHours(value));
    setMinutePart(getMinutePart(value));
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  const apply = () => {
    const totalMinutes = hours * 60 + minutePart;

    onChange(totalMinutes > 0 ? totalMinutes : null);

    setVisible(false);
  };

  const selectPreset = (presetValue: number) => {
    setHours(Math.floor(presetValue / 60));
    setMinutePart(presetValue % 60);
  };

  return (
    <>
      <Pressable style={styles.field} onPress={open}>
        <View style={styles.fieldContent}>
          <Text style={[styles.fieldValue, !value && styles.fieldPlaceholder]}>
            {formatDuration(value)}
          </Text>

          <Text style={styles.arrow}>›</Text>
        </View>
      </Pressable>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />

          <View style={styles.sheet}>
            <View style={styles.handle} />

            <Text style={styles.title}>Duración</Text>

            <Text style={styles.preview}>{formatDuration(hours * 60 + minutePart)}</Text>

            <View style={styles.columns}>
              <View style={styles.column}>
                <Text style={styles.columnLabel}>HORAS</Text>

                <WheelColumn
                  values={HOURS}
                  selectedIndex={selectedHourIndex}
                  onChange={(index) => setHours(HOURS[index])}
                  renderValue={(item) => `${item}`}
                />
              </View>

              <View style={styles.column}>
                <Text style={styles.columnLabel}>MINUTOS</Text>

                <WheelColumn
                  values={MINUTES}
                  selectedIndex={selectedMinuteIndex}
                  onChange={(index) => setMinutePart(MINUTES[index])}
                  renderValue={(item) => item.toString().padStart(2, '0')}
                />
              </View>
            </View>

            <Text style={styles.quickTitle}>Accesos rápidos</Text>

            <View style={styles.presets}>
              {PRESETS.map((preset) => {
                const active = hours * 60 + minutePart === preset.value;

                return (
                  <Pressable
                    key={preset.value}
                    onPress={() => selectPreset(preset.value)}
                    style={[styles.preset, active && styles.presetActive]}
                  >
                    <Text style={[styles.presetText, active && styles.presetTextActive]}>
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.cancelButton} onPress={close}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>

              <Pressable style={styles.doneButton} onPress={apply}>
                <Text style={styles.doneText}>Listo</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: colors.textSubtitle,
    borderRadius: radius.lg,
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: spacing.s4,
  },

  fieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  fieldValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.base,
    color: colors.secondary,
  },

  fieldPlaceholder: {
    color: colors.secondary300,
  },

  arrow: {
    fontFamily: fonts.sansRegular,
    fontSize: 28,
    lineHeight: 28,
    color: colors.secondary300,
  },

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },

  sheet: {
    backgroundColor: colors.surfaceCream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s3,
    paddingBottom: spacing.s6,
  },

  handle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    alignSelf: 'center',
    backgroundColor: colors.secondary100,
    marginBottom: spacing.s4,
  },

  title: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.textMd,
    color: colors.secondary,
    textAlign: 'center',
  },

  preview: {
    marginTop: spacing.s4,
    fontFamily: fonts.sansBold,
    fontSize: 24,
    color: colors.primary,
    textAlign: 'center',
  },

  columns: {
    flexDirection: 'row',
    gap: spacing.s4,
    marginTop: spacing.s4,
  },

  column: {
    flex: 1,
  },

  columnLabel: {
    marginBottom: spacing.s2,
    fontFamily: fonts.sansBold,
    fontSize: fontSize.nano,
    letterSpacing: 0.8,
    color: colors.secondary300,
    textAlign: 'center',
  },

  wheelContainer: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: colors.surfacePaper,
  },

  selectionHighlight: {
    position: 'absolute',
    zIndex: 1,
    top: ((VISIBLE_ITEMS - 1) / 2) * ITEM_HEIGHT,
    left: 8,
    right: 8,
    height: ITEM_HEIGHT,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}0D`,
  },

  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  wheelText: {
    fontFamily: fonts.sansMedium,
    fontSize: 20,
    color: colors.secondary300,
  },

  wheelTextActive: {
    fontFamily: fonts.sansBold,
    color: colors.primary,
  },

  quickTitle: {
    marginTop: spacing.s5,
    marginBottom: spacing.s2,
    fontFamily: fonts.sansBold,
    fontSize: fontSize.nano,
    letterSpacing: 0.8,
    color: colors.secondary300,
  },

  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s2,
  },

  preset: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.secondary100,
    backgroundColor: colors.surfacePaper,
  },

  presetActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}1A`,
  },

  presetText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.sm,
    color: colors.secondary300,
  },

  presetTextActive: {
    color: colors.primary,
  },

  actions: {
    flexDirection: 'row',
    gap: spacing.s3,
    marginTop: spacing.s5,
  },

  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.secondary100,
    backgroundColor: colors.surfacePaper,
  },

  cancelText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.base,
    color: colors.secondary,
  },

  doneButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s4,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },

  doneText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.base,
    color: colors.white,
  },
});
