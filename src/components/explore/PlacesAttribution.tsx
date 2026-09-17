import { Linking, Pressable, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';
import type { PlaceDetails } from '@/types/place';

export function PlacesAttribution({
  attributions = [],
}: {
  attributions?: PlaceDetails['attributions'];
}) {
  return (
    <View style={{ gap: 4, paddingVertical: 8 }}>
      <Text style={{ color: colors.secondary, fontFamily: fonts.sansMedium, fontSize: 12 }}>
        Google Maps
      </Text>
      {attributions.map((a, index) => {
        const allowed = a.providerUri && /^https?:\/\//i.test(a.providerUri) ? a.providerUri : null;
        return (
          <Pressable
            key={`${a.provider}-${index}`}
            disabled={!allowed}
            accessibilityRole={allowed ? 'link' : undefined}
            onPress={() => {
              if (allowed) void Linking.openURL(allowed).catch(() => undefined);
            }}
          >
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                textDecorationLine: allowed ? 'underline' : 'none',
              }}
            >
              {a.provider}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
