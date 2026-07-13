import { View, Text, Pressable, ActivityIndicator, Image, StyleSheet } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '@/constants/theme';

const SIZE = 110;

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

type ProfileAvatarProps = {
  name: string;
  avatarUrl: string | null;
  uploading?: boolean;
  onPressEdit: () => void;
};

export default function ProfileAvatar({
  name,
  avatarUrl,
  uploading = false,
  onPressEdit,
}: ProfileAvatarProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrapper}>
      <View style={styles.circle}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.photo} resizeMode="cover" />
        ) : (
          <Text style={styles.initials}>{getInitials(name)}</Text>
        )}
        {uploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
      </View>
      <Pressable
        style={styles.editButton}
        onPress={onPressEdit}
        disabled={uploading}
        hitSlop={8}
        accessibilityLabel={t('profile.changePhoto')}
      >
        <Ionicons name="camera" size={15} color={colors.surfacePaper} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: SIZE, height: SIZE },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  initials: {
    fontFamily: fonts.sansBold,
    fontSize: 30,
    color: colors.primary,
  },
  loadingOverlay: {
    backgroundColor: 'rgba(255,252,247,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 33,
    height: 33,
    borderRadius: 17,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surfaceCream,
  },
});
