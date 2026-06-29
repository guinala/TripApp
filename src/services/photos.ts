import { supabase } from '@/services/supabase';
import type { Database } from '@/types/database';
import type { Photo } from '@/types/photo';

type PhotoRow = Database['public']['Tables']['photos']['Row'];

export type CreatePhotoInput = {
  tripId: string;
  dayId?: string | null;
  uri: string;
  caption?: string | null;
  location?: { lat: number; lng: number } | null;
  takenAt?: string; // ISO
};

export type UpdatePhotoInput = Partial<Omit<CreatePhotoInput, 'tripId' | 'uri'>>;

function mapRowToPhoto(row: PhotoRow): Photo {
  return {
    id: row.id,
    tripId: row.trip_id,
    dayId: row.day_id,
    uri: row.uri,
    caption: row.caption,
    location: row.location as { lat: number; lng: number } | null,
    takenAt: row.taken_at,
    createdAt: row.created_at,
  };
}

export async function listPhotos(tripId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('trip_id', tripId)
    .order('taken_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapRowToPhoto);
}

export async function createPhoto(input: CreatePhotoInput): Promise<Photo> {
  const { data, error } = await supabase
    .from('photos')
    .insert({
      trip_id: input.tripId,
      day_id: input.dayId ?? null,
      uri: input.uri,
      caption: input.caption ?? null,
      location: input.location ?? null,
      taken_at: input.takenAt ?? new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapRowToPhoto(data as PhotoRow);
}

export async function updatePhoto(id: string, patch: UpdatePhotoInput): Promise<Photo> {
  const row: Database['public']['Tables']['photos']['Update'] = {};
  if (patch.dayId !== undefined) row.day_id = patch.dayId;
  if (patch.caption !== undefined) row.caption = patch.caption;
  if (patch.location !== undefined) row.location = patch.location;
  if (patch.takenAt !== undefined) row.taken_at = patch.takenAt;

  const { data, error } = await supabase
    .from('photos')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return mapRowToPhoto(data as PhotoRow);
}

export async function deletePhoto(photo: Photo): Promise<void> {
  const { error: storageError } = await supabase.storage.from('trip-photos').remove([photo.uri]);
  if (storageError) {
    console.warn(`[photos] No se pudo borrar el archivo ${photo.uri}:`, storageError.message);
  }

  const { error } = await supabase.from('photos').delete().eq('id', photo.id);
  if (error) throw error;
}
