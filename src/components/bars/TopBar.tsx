import { View, Text, StyleSheet, Pressable } from 'react-native';
import React from 'react';
import { colors, fonts, fontSize } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

type TopBarProps = {
  name: string;
  claim: string;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function TopBar({ name, claim }: TopBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{getInitials(name)}</Text>
      </View>

      <View style={styles.texts}>
        <Text style={styles.greeting}>Hola, {name.split(' ')[0]}</Text>
        <View style={styles.claimRow}>
          <Text style={styles.claim} numberOfLines={1}>
            {claim}
          </Text>
          <Ionicons name="airplane" size={13} color={colors.secondary} />
        </View>
      </View>

      <Pressable style={styles.bell} hitSlop={8}>
        <Ionicons name="notifications-outline" size={24} color={colors.secondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    backgroundColor: colors.primary100,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontFamily: fonts.sansExtraBold, fontSize: 16, color: colors.primary },
  texts: { flex: 1, gap: 3 },
  greeting: { fontFamily: fonts.sansRegular, fontSize: fontSize.nano, color: colors.secondary300 },
  claimRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  claim: {
    fontFamily: fonts.sansExtraBold,
    fontSize: fontSize.label,
    color: colors.secondary,
    letterSpacing: 0.2,
  },
  bell: { alignItems: 'center', justifyContent: 'center' },
});
