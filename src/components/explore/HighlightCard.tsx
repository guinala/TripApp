import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, fonts, fontSize, radius } from '@/constants/theme';
import { useUnsplashCover } from '@/hooks/use-unsplash-photos';
import type { DestinationHighlight } from '@/types/destination';

type HighlightCardProps = {
  highlight: DestinationHighlight;
};

export function HighlightCard({ highlight }: HighlightCardProps) {
  const { photo } = useUnsplashCover(highlight.query);

  return (
    <View style={styles.card}>
      <View style={styles.imageWrapper}>
        {photo && (
          <Image
            source={{ uri: photo.smallUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {highlight.name}
        </Text>
        <Text style={styles.tag} numberOfLines={1}>
          {highlight.tag}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    borderRadius: radius.lg,
    backgroundColor: colors.surfacePaper,
    overflow: 'hidden',
  },
  imageWrapper: {
    height: 120.5,
    backgroundColor: colors.surfaceAlt,
  },
  info: {
    padding: 10,
    gap: 2,
  },
  name: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.title,
    color: colors.textPrimary,
  },
  tag: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.nano,
    color: colors.secondary300,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
