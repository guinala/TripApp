import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius } from '@/constants/theme';

export function PlacesButton({
  title,
  onPress,
  disabled = false,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        secondary && ui.secondary,
        disabled && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={[ui.buttonText, secondary && { color: colors.secondary }]}>{title}</Text>
    </Pressable>
  );
}

export function PlacesScreen({
  title,
  children,
  scroll = true,
}: {
  title: string;
  children: ReactNode;
  scroll?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={ui.screen}>
      <View style={ui.header}>
        <PlacesButton
          title={t('common.back')}
          secondary
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/explore')
          }
        />
        <Text style={ui.heading}>{title}</Text>
      </View>
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.body}>
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceCream },
  header: { padding: 16, gap: 12 },
  body: { padding: 20, paddingBottom: 40, gap: 16 },
  heading: { fontFamily: fonts.serifItalic, fontSize: 30, color: colors.secondary },
  title: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.secondary },
  text: {
    fontFamily: fonts.sansRegular,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },
  input: {
    minHeight: 48,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.secondary100,
    borderRadius: radius.md,
    backgroundColor: colors.surfacePaper,
    color: colors.secondary,
    fontFamily: fonts.sansRegular,
  },
  button: {
    minHeight: 48,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primary700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { backgroundColor: colors.secondary100 },
  buttonText: { color: colors.white, fontFamily: fonts.sansBold },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  card: {
    padding: 18,
    gap: 8,
    backgroundColor: colors.surfacePaper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.secondary100,
  },
});
