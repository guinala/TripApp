import { decode } from 'base64-arraybuffer';
import { supabase } from '@/services/supabase';

export async function uploadTripCover(
  userId: string,
  tripId: string,
  base64: string,
): Promise<string> {
  const path = `${userId}/${tripId}.jpg`;

  const { error } = await supabase.storage
    .from('trip-covers')
    .upload(path, decode(base64), { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('trip-covers').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}
