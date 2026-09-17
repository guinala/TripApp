import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import type { Photo } from '@/types/photo';

type PhotoViewerProps = {
  initialIndex: number;
  orderedPhotos: Photo[];
  urls: Map<string, string>;
  handlePageSelected: (event: { nativeEvent: { position: number } }) => void;
};

// PagerView utiliza componentes nativos; en web navegamos con controles accesibles.
export function PhotoViewer({
  initialIndex,
  orderedPhotos,
  urls,
  handlePageSelected,
}: PhotoViewerProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(initialIndex);
  const index = Math.max(0, Math.min(selected, orderedPhotos.length - 1));
  const photo = orderedPhotos[index];
  const url = photo ? urls.get(photo.uri) : undefined;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const move = (position: number) => {
    setSelected(position);
    handlePageSelected({ nativeEvent: { position } });
  };

  return (
    <View style={styles.viewer}>
      {!photo || (url && failedUrl === url) ? (
        <View style={styles.center}>
          <Text style={styles.text}>{t('photo.unavailablePhoto')}</Text>
        </View>
      ) : url ? (
        <Image
          source={{ uri: url }}
          style={styles.image}
          contentFit="contain"
          accessibilityLabel={photo.caption || t('photo.imageLabel')}
          onError={() => setFailedUrl(url)}
        />
      ) : (
        <View style={styles.center}>
          <ActivityIndicator color={colors.surfacePaper} />
        </View>
      )}
      {orderedPhotos.length > 1 && (
        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            disabled={index === 0}
            accessibilityState={{ disabled: index === 0 }}
            onPress={() => move(index - 1)}
            style={[styles.button, index === 0 && styles.disabled]}
          >
            <Text style={styles.text}>{t('photo.previous')}</Text>
          </Pressable>
          <Text style={styles.text}>
            {index + 1} / {orderedPhotos.length}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={index === orderedPhotos.length - 1}
            accessibilityState={{ disabled: index === orderedPhotos.length - 1 }}
            onPress={() => move(index + 1)}
            style={[styles.button, index === orderedPhotos.length - 1 && styles.disabled]}
          >
            <Text style={styles.text}>{t('photo.next')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  viewer: { flex: 1 },
  image: { flex: 1, width: '100%' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 12,
  },
  button: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: colors.secondary,
    borderRadius: 8,
  },
  disabled: { opacity: 0.4 },
  text: { color: colors.surfacePaper },
});
