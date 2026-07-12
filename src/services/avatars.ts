import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/services/supabase';

const BUCKET = 'user-avatars';
const AVATAR_SIZE = 512;

export async function pickAvatarImage(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  return result.canceled ? null : result.assets[0].uri;
}

export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: AVATAR_SIZE, height: AVATAR_SIZE } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  if (!manipulated.base64) throw new Error('No se pudo procesar la imagen');

  const path = `avatars/${userId}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, decode(manipulated.base64), {
      contentType: 'image/jpeg',
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const versionedUrl = `${data.publicUrl}?v=${Date.now()}`; // breaks expo-image cache

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: versionedUrl })
    .eq('id', userId);
  if (updateError) throw updateError;

  return versionedUrl;
}
