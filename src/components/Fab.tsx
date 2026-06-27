import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

interface Props {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  bottomOffset?: number;
  accessibilityLabel?: string;
}

export function Fab({ onPress, icon = 'add', bottomOffset = 96, accessibilityLabel }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      style={[styles.fab, { bottom: insets.bottom + bottomOffset }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      <Ionicons name={icon} size={28} color={colors.surfacePaper} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});
