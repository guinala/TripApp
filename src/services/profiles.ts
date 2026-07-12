import { supabase } from '@/services/supabase';
import { Database } from '@/types/database';
import type { Profile } from '@/types/profile';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type UpdateProfileInput = Partial<{
  displayName: string;
  avatarUrl: string | null;
  defaultCurrency: string;
  preferredLanguage: string;
}>;

function mapRowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name ?? '',
    avatarUrl: row.avatar_url,
    defaultCurrency: row.default_currency ?? 'EUR',
    preferredLanguage: row.preferred_language ?? 'es',
    createdAt: row.created_at,
  };
}

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return mapRowToProfile(data);
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
  const patch: ProfileUpdate = {};
  if (input.displayName !== undefined) patch.display_name = input.displayName;
  if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;
  if (input.defaultCurrency !== undefined) patch.default_currency = input.defaultCurrency;
  if (input.preferredLanguage !== undefined) patch.preferred_language = input.preferredLanguage;

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return mapRowToProfile(data);
}
