import { Activity, ActivityCategory } from '@/types/activity';
import { supabase } from './supabase';
import { Database } from '@/types/database';

type ActivityUpdate = Database['public']['Tables']['activities']['Update'];

type ActivityRow = {
  id: string;
  day_id: string;
  title: string;
  time: string | null;
  location: { lat: number; lng: number } | null;
  address: string | null;
  place_id: string | null;
  notes: string | null;
  category: ActivityCategory;
  order_index: number;
};

export type ActivityInput = {
  dayId: string;
  title: string;
  time?: string | null;
  location?: { lat: number; lng: number } | null;
  address?: string | null;
  placeId?: string | null;
  notes?: string | null;
  category: ActivityCategory;
  orderIndex?: number;
};

function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    dayId: row.day_id,
    title: row.title,
    // Postgres devuelve 'HH:mm:ss'; solo 'HH:mm'
    time: row.time ? row.time.slice(0, 5) : null,
    location: row.location,
    address: row.address,
    placeId: row.place_id,
    notes: row.notes,
    category: row.category,
    orderIndex: row.order_index,
  };
}

export async function listActivitiesByTrip(tripId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*, days!inner(trip_id)')
    .eq('days.trip_id', tripId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return (data as ActivityRow[]).map(toActivity);
}

export async function createActivity(input: ActivityInput): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .insert({
      day_id: input.dayId,
      title: input.title,
      time: input.time ?? null,
      location: input.location ?? null,
      address: input.address ?? null,
      place_id: input.placeId ?? null,
      notes: input.notes ?? null,
      category: input.category,
      order_index: input.orderIndex ?? 0,
    })
    .select('*')
    .single();

  if (error) throw error;
  return toActivity(data as ActivityRow);
}

export async function updateActivity(id: string, patch: Partial<ActivityInput>): Promise<Activity> {
  const row: ActivityUpdate = {};
  if (patch.dayId !== undefined) row.day_id = patch.dayId;
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.time !== undefined) row.time = patch.time;
  if (patch.location !== undefined) row.location = patch.location;
  if (patch.address !== undefined) row.address = patch.address;
  if (patch.placeId !== undefined) row.place_id = patch.placeId;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.orderIndex !== undefined) row.order_index = patch.orderIndex;

  const { data, error } = await supabase
    .from('activities')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return toActivity(data as ActivityRow);
}

export async function deleteActivity(id: string): Promise<void> {
  const { error } = await supabase.from('activities').delete().eq('id', id);
  if (error) throw error;
}

// Persistir nuevo order_index de cada actividad
export async function reorderActivities(orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('activities').update({ order_index: index }).eq('id', id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}
