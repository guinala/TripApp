import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize } from '@/constants/theme';

type PackingListItemProps = {
  name: string;
  checked: boolean;
  onToggle: () => void;
  onLongPress?: () => void;
  warning?: string;
  showDivider?: boolean;
};

function PackingListItemBase({
  name,
  checked,
  onToggle,
  onLongPress,
  warning,
  showDivider = true,
}: PackingListItemProps) {
  const progress = useSharedValue(checked ? 1 : 0);
  const checkScale = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(checked ? 1 : 0, { duration: 160 });
    checkScale.value = withSpring(checked ? 1 : 0, { damping: 12, stiffness: 180 });
  }, [checked, progress, checkScale]);

  const boxStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.surfacePaper, colors.primary],
    ),
    borderColor: interpolateColor(progress.value, [0, 1], [colors.textSubtitle, colors.primary]),
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <Pressable
      onPress={onToggle}
      onLongPress={onLongPress}
      style={[styles.row, showDivider && styles.divider]}
    >
      <Animated.View style={[styles.checkbox, boxStyle]}>
        <Animated.View style={checkStyle}>
          <Ionicons name="checkmark" size={12} color={colors.white} />
        </Animated.View>
      </Animated.View>

      <View style={styles.body}>
        <Text
          style={[styles.name, checked ? styles.nameChecked : styles.nameUnchecked]}
          numberOfLines={2}
        >
          {name}
        </Text>

        {warning ? (
          <View style={styles.warningRow}>
            <Ionicons name="warning" size={12} color={colors.danger} />
            <Text style={styles.warningText}>{warning}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export const PackingListItem = memo(PackingListItemBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.textSubtitle,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  name: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.nano,
    letterSpacing: 0.2,
  },
  nameUnchecked: { color: colors.secondary },
  nameChecked: {
    color: colors.secondary300,
    textDecorationLine: 'line-through',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  warningText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.nano,
    color: colors.danger,
  },
});
