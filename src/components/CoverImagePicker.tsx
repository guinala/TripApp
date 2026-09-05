import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';

export type PickedCover = {
  uri: string;
  base64: string;
};

type CoverImagePickerProps = {
  previewUri: string | null;
  onPick: (image: PickedCover) => void;
  onRemove?: () => void;
  disabled?: boolean;
};

export function CoverImagePicker({
  previewUri,
  onPick,
  onRemove,
  disabled = false,
}: CoverImagePickerProps) {
  const { t } = useTranslation();

  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('trips.form.coverPermissionTitle'), t('trips.form.coverPermissionMessage'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset?.base64) {
      Alert.alert(t('common.error'), t('trips.form.coverProcessError'));
      return;
    }

    onPick({ uri: asset.uri, base64: asset.base64 });
  };

  const hasPreview = Boolean(previewUri);

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={[styles.box, disabled && styles.disabled]}
        onPress={pick}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={hasPreview ? t('trips.form.changeCover') : t('trips.form.addCover')}
        accessibilityHint={t('trips.form.coverPickerHint')}
      >
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}

        <View pointerEvents="none" style={[styles.overlay, hasPreview && styles.overlayDim]}>
          <Ionicons
            name={hasPreview ? 'image-outline' : 'camera-outline'}
            size={28}
            color={hasPreview ? colors.white : colors.secondary}
          />
          <Text style={[styles.text, hasPreview && styles.textOnImage]}>
            {hasPreview ? t('trips.form.changeCover') : t('trips.form.addCover')}
          </Text>
        </View>
      </Pressable>

      {hasPreview && onRemove ? (
        <Pressable
          style={styles.removeButton}
          onPress={onRemove}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={t('trips.form.removeCover')}
        >
          <Ionicons name="trash-outline" size={18} color={colors.white} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  box: {
    height: 180,
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s2,
  },
  overlayDim: { backgroundColor: 'rgba(0,0,0,0.34)' },
  text: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.sm,
    color: colors.secondary,
  },
  textOnImage: { color: colors.white },
  removeButton: {
    position: 'absolute',
    top: spacing.s2,
    right: spacing.s2,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  disabled: { opacity: 0.55 },
});
