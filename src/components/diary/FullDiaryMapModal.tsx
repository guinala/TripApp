import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/constants/theme';
import { DiaryMap } from './DiaryMap';
import type { DiaryPhoto } from '@/hooks/use-diary-photos';

type FullDiaryMapModalProps = {
  visible: boolean;
  photos: DiaryPhoto[];
  onClose: () => void;
  onPressPhoto?: (photo: DiaryPhoto) => void;
};

export function FullDiaryMapModal({
  visible,
  photos,
  onClose,
  onPressPhoto,
}: FullDiaryMapModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <DiaryMap photos={photos} onPressPhoto={onPressPhoto} style={StyleSheet.absoluteFill} />

        <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.secondary} />
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceCream },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s3,
    alignItems: 'flex-start',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfacePaper,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
