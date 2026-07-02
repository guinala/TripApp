import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import type { DiaryPhoto } from '@/hooks/use-diary-photos';

type TimelinePhotoItemProps = {
  photo: DiaryPhoto;
  onPress?: () => void;
};

export function TimelinePhotoItem({ photo, onPress }: TimelinePhotoItemProps) {
  const time = format(parseISO(photo.takenAt), 'HH:mm');

  return (
    <View style={styles.wrapper}>
      <View style={styles.meta}>
        <Text style={styles.time}>{time}</Text>
        {photo.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.secondary300} />
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Pressable onPress={onPress}>
          {photo.uri ? (
            <Image source={{ uri: photo.uri }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={[styles.image, styles.placeholder]} />
          )}
        </Pressable>

        {photo.caption ? (
          <Text style={styles.caption} numberOfLines={3}>
            {photo.caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', gap: spacing.s3 },
  meta: { width: 44, alignItems: 'flex-end', gap: spacing.s1, paddingTop: spacing.s1 },
  time: { fontFamily: fonts.sansSemiBold, fontSize: fontSize.nano, color: colors.secondary300 },
  locationRow: { alignItems: 'flex-end' },
  card: { flex: 1, gap: spacing.s2 },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
  },
  placeholder: { backgroundColor: colors.surfaceAlt },
  caption: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.sm,
    color: colors.secondary,
    lineHeight: 19,
  },
});
