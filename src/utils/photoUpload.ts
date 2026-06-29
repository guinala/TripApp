import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/services/supabase';

export type PickedPhoto = {
  base64: string;
  location: { lat: number; lng: number } | null;
  takenAt: string | null; // ISO
};

async function manipulateAndEncode(uri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1600 } }], {
    compress: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });

  if (!manipulated.base64) {
    throw new Error('No se pudo procesar la imagen');
  }
  return manipulated.base64;
}

function extractExif(exif: ImagePicker.ImagePickerAsset['exif']): {
  location: PickedPhoto['location'];
  takenAt: PickedPhoto['takenAt'];
} {
  const lat = exif?.GPSLatitude;
  const lng = exif?.GPSLongitude;
  const location = typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : null;
  const takenAt = exif?.DateTimeOriginal ? new Date(exif.DateTimeOriginal).toISOString() : null;
  return { location, takenAt };
}

export async function pickPhotoFromLibrary(): Promise<PickedPhoto | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.9,
    exif: true,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  const base64 = await manipulateAndEncode(asset.uri);
  const { location, takenAt } = extractExif(asset.exif);

  return { base64, location, takenAt };
}

export async function takePhotoWithCamera(): Promise<PickedPhoto | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.9,
    exif: true,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  const base64 = await manipulateAndEncode(asset.uri);
  const { location, takenAt } = extractExif(asset.exif);

  return { base64, location, takenAt };
}

export async function uploadPhotoFile(
  userId: string,
  tripId: string,
  base64: string,
): Promise<string> {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const path = `${userId}/${tripId}/diary/${filename}`;

  const { error } = await supabase.storage
    .from('trip-photos')
    .upload(path, decode(base64), { contentType: 'image/jpeg' });

  if (error) throw error;
  return path;
}
