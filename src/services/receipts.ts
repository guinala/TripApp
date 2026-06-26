import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

const BUCKET = 'trip-photos';

export async function uploadReceipt(params: {
  userId: string;
  tripId: string;
  base64: string;
  ext?: string; // 'jpg'
}): Promise<string> {
  const { userId, tripId, base64, ext = 'jpg' } = params;
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${userId}/${tripId}/receipts/${fileName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, decode(base64), {
    contentType: ext === 'jpg' ? 'image/jpeg' : `image/${ext}`,
    upsert: false,
  });

  if (error) throw error;
  return path;
}

export async function getReceiptUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteReceipt(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
