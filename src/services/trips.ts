import { supabase } from '@/services/supabase';
import { Database } from '@/types/database';
import type { Trip, TripType } from '@/types/trip';

export type CreateTripInput = {
  title: string;
  destination: string;
  coverImage?: string | null;
  startDate: string;
  endDate: string;
  budget?: number | null;
  currency: string;
  tripType?: TripType | null;
};

// Datos de Supabase
type TripRow = Database['public']['Tables']['trips']['Row'];

// DB -> dominio
function mapRowToTrip(row: TripRow): Trip {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    destination: row.destination,
    coverImage: row.cover_image,
    startDate: row.start_date,
    endDate: row.end_date,
    budget: row.budget,
    currency: row.currency,
    status: row.status as Trip['status'],
    tripType: row.trip_type as TripType | null,
    createdAt: row.created_at,
  };
}

export async function listTrips(userId: string): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapRowToTrip);
}

export async function getTrip(id: string): Promise<Trip> {
  const { data, error } = await supabase.from('trips').select('*').eq('id', id).single();

  if (error) throw error;
  return mapRowToTrip(data);
}

export async function createTrip(userId: string, input: CreateTripInput): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .insert({
      user_id: userId,
      title: input.title,
      destination: input.destination,
      cover_image: input.coverImage ?? null,
      start_date: input.startDate,
      end_date: input.endDate,
      budget: input.budget ?? null,
      currency: input.currency,
      trip_type: input.tripType ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRowToTrip(data);
}

export async function updateTrip(id: string, patch: Partial<CreateTripInput>): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .update({
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.destination !== undefined && { destination: patch.destination }),
      ...(patch.coverImage !== undefined && { cover_image: patch.coverImage }),
      ...(patch.startDate !== undefined && { start_date: patch.startDate }),
      ...(patch.endDate !== undefined && { end_date: patch.endDate }),
      ...(patch.budget !== undefined && { budget: patch.budget }),
      ...(patch.currency !== undefined && { currency: patch.currency }),
      ...(patch.tripType !== undefined && { trip_type: patch.tripType }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapRowToTrip(data);
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
}
