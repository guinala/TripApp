import { ActivityIndicator, StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { ImageZoom } from '@likashefqet/react-native-image-zoom';
import { useRef, type RefObject } from 'react';
import { colors } from '@/constants/theme';
import { Photo } from '@/types/photo';

type PhotoViewerProps = {
  initialIndex: number;
  orderedPhotos: Photo[];
  urls: Map<string, string>;
  handlePageSelected: (e: { nativeEvent: { position: number } }) => void;
};
export function PhotoViewer({
  initialIndex,
  orderedPhotos,
  urls,
  handlePageSelected,
}: PhotoViewerProps) {
  const pagerRef = useRef<PagerView>(null);

  return (
    <>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialIndex}
        onPageSelected={handlePageSelected}
      >
        {orderedPhotos.map((photo) => {
          const url = urls.get(photo.uri);
          return (
            <View key={photo.id} style={styles.page}>
              {url ? (
                <ImageZoom
                  uri={url}
                  style={styles.image}
                  minScale={1}
                  maxScale={4}
                  isDoubleTapEnabled
                />
              ) : (
                <View style={styles.loadingPage}>
                  <ActivityIndicator color={colors.surfacePaper} />
                </View>
              )}
            </View>
          );
        })}
      </PagerView>
      ;
    </>
  );
}

const styles = StyleSheet.create({
  pager: { flex: 1 },
  page: { flex: 1, justifyContent: 'center' },
  image: { flex: 1 },
  loadingPage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
