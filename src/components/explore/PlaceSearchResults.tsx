import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PlaceSuggestion } from '@/types/place';
import { colors, fonts, radius } from '@/constants/theme';
import { PlacesAttribution } from './PlacesAttribution';

export function PlaceSearchResults({
  suggestions,
  selecting,
  onSelect,
}: {
  suggestions: PlaceSuggestion[];
  selecting: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <FlatList
      keyboardShouldPersistTaps="handled"
      data={suggestions}
      keyExtractor={(s) => s.placeId}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.card,
            selecting && styles.disabled,
            pressed && styles.cardPressed,
          ]}
          disabled={selecting}
          onPress={() => onSelect(item.placeId)}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="location-sharp" size={20} color={colors.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.mainText} numberOfLines={1}>
              {item.mainText}
            </Text>
            {!!item.secondaryText && (
              <Text style={styles.secondaryText} numberOfLines={1}>
                {item.secondaryText}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.secondary300} />
        </Pressable>
      )}
      ListFooterComponent={
        suggestions.length ? (
          <View style={styles.attribution}>
            <PlacesAttribution showGoogle />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 12,
    paddingBottom: 40,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.secondary100,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  cardPressed: {
    backgroundColor: 'rgba(226, 109, 79, 0.08)',
    borderColor: colors.primary,
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  mainText: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.secondary,
  },
  secondaryText: {
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  attribution: {
    marginTop: 8,
  },
});
