import { FlatList, Pressable, Text, View } from 'react-native';
import type { PlaceSuggestion } from '@/types/place';
import { PlacesAttribution } from './PlacesAttribution';
import { ui } from './PlacesUI';
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
      contentContainerStyle={ui.body}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          style={ui.card}
          disabled={selecting}
          onPress={() => onSelect(item.placeId)}
        >
          <Text style={ui.title}>{item.mainText}</Text>
          <Text style={ui.text}>{item.secondaryText}</Text>
        </Pressable>
      )}
      ListFooterComponent={
        suggestions.length ? (
          <View>
            <PlacesAttribution />
          </View>
        ) : null
      }
    />
  );
}
