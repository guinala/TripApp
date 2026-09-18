import { Linking, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { RemoteImage } from '@/components/ui/RemoteImage';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useUnsplashCover } from '@/hooks/use-unsplash-photos';
import type { EditorialDestination } from '@/types/destination';
import { colors, fonts } from '@/constants/theme';
import { DESTINATION_TYPE_LABELS } from '@/constants/destinations';

export function DestinationCard({
  destination,
  onPress,
  style,
}: {
  destination: EditorialDestination;
  onPress: () => void;
  style?: ViewStyle;
}) {
  const { t } = useTranslation();
  const { photo } = useUnsplashCover(destination.coverQuery);

  return (
    <View style={[styles.card, style]}>
      <Pressable accessibilityRole="button" onPress={onPress}>
        <View style={styles.picture}>
          {photo ? (
            <RemoteImage uri={photo.smallUrl} label={destination.name} />
          ) : (
            <Ionicons name="compass-outline" size={40} color={colors.primary700} />
          )}
        </View>
        <View style={styles.body}>
          <Text style={styles.name}>{destination.name}</Text>
          <Text style={styles.country}>{destination.country}</Text>
          <Text style={styles.tags}>
            {destination.types.map((type) => t(DESTINATION_TYPE_LABELS[type])).join(' · ')}
          </Text>
        </View>
      </Pressable>
      {photo && (
        <Pressable
          accessibilityRole="link"
          onPress={() => {
            void Linking.openURL(photo.authorLink).catch(() => undefined);
          }}
          style={styles.credit}
        >
          <Text style={styles.country}>{photo.authorName} · Unsplash</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: colors.secondary100,
    overflow: 'hidden',
  },
  picture: {
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  body: { padding: 12, gap: 6 },
  name: { fontFamily: fonts.serifItalic, fontSize: 24, color: colors.secondary },
  country: { fontFamily: fonts.sansRegular, fontSize: 12, color: colors.textSecondary },
  tags: { color: colors.primary700, fontFamily: fonts.sansMedium, fontSize: 12 },
  credit: { paddingHorizontal: 12, minHeight: 44, justifyContent: 'center' },
});
