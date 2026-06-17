import { View, Text, StyleSheet, Pressable } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function TripsEmptyState() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        <Ionicons name="airplane" size={90} color={colors.primary} />
      </View>

      <Text style={styles.title}>
        Aún no tienes <Text style={styles.titleAccent}>viajes</Text>
      </Text>
      <Text style={styles.subtitle}>
        Crea tu primer itinerario e inspírate con los últimos destinos disponibles.
      </Text>

      <Pressable style={styles.primaryBtn} onPress={() => router.push('/trips/new')}>
        <Ionicons name="add" size={20} color={colors.surfacePaper} />
        <Text style={styles.primaryLabel}>Crear primer viaje</Text>
      </Pressable>

      <Pressable style={styles.secondaryBtn} onPress={() => router.push('/explore')}>
        <Ionicons name="compass-outline" size={20} color={colors.primary} />
        <Text style={styles.secondaryLabel}>Explorar destinos</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 20, gap: 14 },
  illustration: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary50,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: { fontFamily: fonts.serif, fontSize: fontSize.textSm, color: colors.secondary },
  titleAccent: { fontFamily: fonts.serifItalic, color: colors.primary },
  subtitle: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.label,
    color: colors.textMetadata,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignSelf: 'stretch',
    marginTop: 8,
  },
  primaryLabel: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.surfacePaper },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignSelf: 'stretch',
  },
  secondaryLabel: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.primary },
});
