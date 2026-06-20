import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '@/constants/theme';

export function FullMapModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.text}>Mapa no disponible en web</Text>
        <Pressable style={styles.btn} onPress={onClose} hitSlop={10}>
          <Ionicons name="close" size={22} color={colors.secondary} />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceCream,
    gap: spacing.s4,
  },
  text: { fontFamily: fonts.sansRegular, color: colors.secondary300 },
  btn: { padding: spacing.s3 },
});
