import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PlaceSummary } from '@/types/place';
import { ui } from './places-ui';
import { PlacesAttribution } from './places-attribution';
import { colors } from '@/constants/theme';
export function PlaceResultRow({
  place,
  onPress,
  disabled = false,
}: {
  place: PlaceSummary;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={ui.card}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={[ui.row, { minHeight: 48 }]}
      >
        <Ionicons name="location-outline" size={24} color={colors.primary700} />
        <View style={{ flex: 1 }}>
          <Text style={ui.title}>{place.name}</Text>
          {place.address && <Text style={ui.text}>{place.address}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
      </Pressable>
      <PlacesAttribution attributions={place.attributions} />
    </View>
  );
}
