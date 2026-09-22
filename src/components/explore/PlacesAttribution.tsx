import { Linking, Pressable, Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import type { PlaceDetails } from '@/types/place';

export function PlacesAttribution({
  attributions = [],
  light = false,
  showGoogle = false,
}: {
  attributions?: PlaceDetails['attributions'];
  light?: boolean;
  showGoogle?: boolean;
}) {
  const entries = [
    ...(showGoogle ? [{ provider: 'Google Maps', providerUri: 'https://maps.google.com' }] : []),
    ...attributions,
  ].filter(
    (entry, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.provider === entry.provider && candidate.providerUri === entry.providerUri,
      ) === index,
  );
  if (entries.length === 0) return null;
  return (
    <View style={{ gap: 2, paddingVertical: 4 }}>
      {entries.map((a, index) => {
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
                color: light ? colors.white : colors.textSecondary,
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
