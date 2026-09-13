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

export function parseExifDate(rawDate?: string | null): string | null {
  if (!rawDate || typeof rawDate !== 'string') return null;
  try {
    const trimmed = rawDate.trim();
    // El formato estándar EXIF es "YYYY:MM:DD HH:MM:SS"
    const parts = trimmed.split(' ');
    if (parts.length >= 2) {
      const datePart = parts[0].replace(/:/g, '-');
      const timePart = parts[1];
      const isoCandidate = `${datePart}T${timePart}`;
      const parsed = new Date(isoCandidate);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    } else if (parts.length === 1 && parts[0].includes(':')) {
      const datePart = parts[0].replace(/:/g, '-');
      const parsed = new Date(datePart);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    const directParsed = new Date(trimmed);
    if (!isNaN(directParsed.getTime())) {
      return directParsed.toISOString();
    }
  } catch {
    // Si falla el formateo de fecha, no abortamos la subida de la foto
  }
  return null;
}

function extractExif(exif: ImagePicker.ImagePickerAsset['exif']): {
  location: PickedPhoto['location'];
  takenAt: PickedPhoto['takenAt'];
} {
  let location: PickedPhoto['location'] = null;
  try {
    const rawLat = exif?.GPSLatitude;
    const rawLng = exif?.GPSLongitude;
    if (rawLat != null && rawLng != null) {
      let lat = typeof rawLat === 'number' ? rawLat : Number(rawLat);
      let lng = typeof rawLng === 'number' ? rawLng : Number(rawLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        // Ajustar referencias hemisféricas S y W/O si vienen como valores absolutos
        if (exif?.GPSLatitudeRef === 'S' && lat > 0) lat = -lat;
        if ((exif?.GPSLongitudeRef === 'W' || exif?.GPSLongitudeRef === 'O') && lng > 0) lng = -lng;
        location = { lat, lng };
      }
    }
  } catch {
    location = null;
  }

  const takenAt = parseExifDate(exif?.DateTimeOriginal);
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
