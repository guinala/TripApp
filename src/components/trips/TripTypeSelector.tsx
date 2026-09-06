import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import type { TripType } from '@/types/trip';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const TYPES: { key: TripType; labelKey: string; icon: IconName }[] = [
  { key: 'city', labelKey: 'trips.types.city', icon: 'city-variant-outline' },
  { key: 'beach', labelKey: 'trips.types.beach', icon: 'beach' },
  { key: 'mountain', labelKey: 'trips.types.mountain', icon: 'terrain' },
  { key: 'road', labelKey: 'trips.types.road', icon: 'car-outline' },
  { key: 'business', labelKey: 'trips.types.business', icon: 'briefcase-outline' },
];

type TripTypeSelectorProps = {
  value: TripType | null;
  onChange: (t: TripType) => void;
};

export function TripTypeSelector({ value, onChange }: TripTypeSelectorProps) {
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {TYPES.map(({ key, labelKey, icon }) => {
        const active = value === key;
        const tint = active ? colors.surfacePaper : colors.textSecondary;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
          >
            <MaterialCommunityIcons name={icon} size={16} color={tint} />
            <Text style={[styles.label, { color: tint }]}>{t(labelKey)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  pillActive: { backgroundColor: colors.secondaryDark },
  pillInactive: { borderWidth: 1, borderColor: colors.secondary300 },
  label: { fontFamily: fonts.sansBold, fontSize: fontSize.sm },
});
