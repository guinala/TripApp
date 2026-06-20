import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';

type CoverImagePickerProps = {
  currentUrl: string | null;
  onPick: (image: { uri: string; base64: string }) => void;
};

export function CoverImagePicker({ currentUrl, onPick }: CoverImagePickerProps) {
  const [localUri, setLocalUri] = useState<string | null>(null);

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) return;

    setLocalUri(asset.uri);
    onPick({ uri: asset.uri, base64: asset.base64 });
  };

  const preview = localUri ?? currentUrl;

  return (
    <Pressable style={styles.box} onPress={pick}>
      {preview ? (
        <Image source={{ uri: preview }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}
      <View style={[styles.overlay, preview ? styles.overlayDim : null]}>
        <Ionicons name="camera" size={24} color={preview ? colors.white : colors.secondary300} />
        <Text style={[styles.text, preview ? { color: colors.white } : null]}>
          {preview ? 'Cambiar portada' : 'Añadir portada'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 160,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.secondary100,
  },
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s2,
  },
  overlayDim: { backgroundColor: 'rgba(0,0,0,0.25)' },
  text: { fontFamily: fonts.sansSemiBold, fontSize: fontSize.sm, color: colors.secondary300 },
});
