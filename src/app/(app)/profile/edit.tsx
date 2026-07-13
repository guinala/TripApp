import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { pickAvatarImage, uploadAvatar } from '@/services/avatars';
import ProfileAvatar from '@/components/profile/ProfileAvatar';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.update);
  const setAvatarUrl = useProfileStore((s) => s.setAvatarUrl);

  const [name, setName] = useState(profile?.displayName ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChangeAvatar = useCallback(async () => {
    if (!user) return;
    try {
      const uri = await pickAvatarImage();
      if (!uri) return;
      setUploading(true);
      const url = await uploadAvatar(user.id, uri);
      setAvatarUrl(url);
    } catch {
      Alert.alert(t('common.error'), t('profile.edit.errorPhoto'));
    } finally {
      setUploading(false);
    }
  }, [user, setAvatarUrl, t]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert(t('profile.edit.nameEmptyTitle'), t('profile.edit.nameEmptyMessage'));
      return;
    }
    if (trimmed === profile?.displayName) {
      router.back();
      return;
    }
    setSaving(true);
    try {
      await updateProfile(user.id, { displayName: trimmed });
      router.back();
    } catch {
      Alert.alert(t('common.error'), t('profile.edit.errorSave'));
    } finally {
      setSaving(false);
    }
  }, [user, name, profile, updateProfile, router, t]);

  const dirty = name.trim() !== (profile?.displayName ?? '');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('profile.edit.title')}</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarWrapper}>
            <ProfileAvatar
              name={name || profile?.displayName || t('profile.defaultName')}
              avatarUrl={profile?.avatarUrl ?? null}
              uploading={uploading}
              onPressEdit={handleChangeAvatar}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('profile.edit.nameLabel').toUpperCase()}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('auth.register.namePlaceholder')}
              placeholderTextColor={colors.secondary300}
              autoCapitalize="words"
              maxLength={40}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('auth.email').toUpperCase()}</Text>
            <View style={[styles.input, styles.inputDisabled]}>
              <Text style={styles.disabledText}>{user?.email}</Text>
              <Ionicons name="lock-closed" size={14} color={colors.secondary300} />
            </View>
            <Text style={styles.hint}>{t('profile.edit.emailHint')}</Text>
          </View>

          <Pressable
            style={[styles.saveButton, (!dirty || saving) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!dirty || saving}
          >
            <Text style={styles.saveText}>
              {saving ? t('common.saving') : t('profile.edit.save')}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceCream },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(27, 45, 79, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  content: { padding: 25, gap: 24 },
  avatarWrapper: { alignItems: 'center', marginVertical: 10 },
  field: { gap: 8 },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 0.6,
    color: '#8A95AC',
  },
  input: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ece2d4',
    backgroundColor: colors.surfacePaper,
    paddingHorizontal: 16,
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    color: colors.ink,
  },
  inputDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 0.7,
  },
  disabledText: { fontFamily: fonts.sansRegular, fontSize: 15, color: colors.secondary300 },
  hint: { fontFamily: fonts.sansRegular, fontSize: 11, color: '#8A95AC' },
  saveButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveText: { fontFamily: fonts.sansBold, fontSize: 15, color: '#fff' },
});
