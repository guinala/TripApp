import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';

export function SettingsSection({ label, children }: { label: string; children: ReactNode }) {
  const items = Children.toArray(children);
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <View style={styles.card}>
        {items.map((child, i) => (
          <Fragment key={i}>
            {i > 0 && <View style={styles.divider} />}
            {child}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 0.6,
    color: '#8A95AC',
    paddingLeft: 4,
  },
  card: {
    backgroundColor: colors.surfacePaper,
    borderRadius: 16,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(27, 45, 79, 0.10)',
    marginLeft: 16,
  },
});
