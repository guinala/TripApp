import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';

export interface ReceiptAsset {
  uri: string;
  base64: string;
}

interface Props {
  value: ReceiptAsset | null;
  onChange: (asset: ReceiptAsset | null) => void;
}

export function ReceiptPicker({ value, onChange }: Props) {
  const { t } = useTranslation();
  async function pick() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('common.permissionNeeded'), t('budget.receipt.permissionMessage'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset?.base64) onChange({ uri: asset.uri, base64: asset.base64 });
  }

  if (value) {
    return (
      <View style={styles.preview}>
        <Image source={{ uri: value.uri }} style={styles.thumb} />
        <Text style={styles.previewText} numberOfLines={1}>
          {t('budget.receipt.attached')}
        </Text>
        <Pressable onPress={() => onChange(null)} hitSlop={8}>
          <Ionicons name="close-circle" size={22} color={colors.secondary300} />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable style={styles.button} onPress={pick}>
      <Ionicons name="camera-outline" size={20} color={colors.secondary} />
      <Text style={styles.buttonText}>{t('budget.receipt.attach')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s2,
    paddingVertical: spacing.s4,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.secondary300,
    borderRadius: radius.md,
  },
  buttonText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.secondary },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    borderWidth: 1,
    borderColor: '#ece2d4',
    borderRadius: radius.md,
    backgroundColor: colors.surfacePaper,
  },
  thumb: { width: 40, height: 40, borderRadius: radius.sm },
  previewText: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.label,
    color: colors.secondary,
  },
});
