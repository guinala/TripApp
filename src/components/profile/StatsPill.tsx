import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '@/constants/theme';

type StatItem = { value: string; label: string };

export function StatsPill({ items }: { items: StatItem[] }) {
  return (
    <View style={styles.card}>
      {items.map((item, i) => (
        <View key={item.label} style={[styles.stat, i > 0 && styles.divided]}>
          <Text style={styles.value}>{item.value}</Text>
          <Text style={styles.label}>{item.label.toUpperCase()}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: colors.secondary100,
    borderRadius: 22,
    paddingHorizontal: 25,
    paddingVertical: 15,
  },
  stat: {
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  divided: {
    borderLeftWidth: 1,
    borderLeftColor: colors.surfaceAlt,
  },
  value: {
    fontFamily: fonts.serifItalic,
    fontSize: 22,
    color: colors.primary,
  },
  label: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    color: colors.secondary300,
  },
});
