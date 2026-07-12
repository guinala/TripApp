import { supabase } from '@/services/supabase';

export async function exportUserData(userId: string) {
  const [profileRes, tripsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('trips').select('*').eq('user_id', userId),
  ]);
  if (tripsRes.error) throw tripsRes.error;

  const trips = tripsRes.data ?? [];
  const tripIds = trips.map((t) => t.id);

  const empty = { data: [] as unknown[], error: null };
  const [daysRes, expensesRes, packingRes, photosRes] = tripIds.length
    ? await Promise.all([
        supabase.from('days').select('*').in('trip_id', tripIds),
        supabase.from('expenses').select('*').in('trip_id', tripIds),
        supabase.from('packing_items').select('*').in('trip_id', tripIds),
        supabase.from('photos').select('*').in('trip_id', tripIds),
      ])
    : [empty, empty, empty, empty];

  const dayIds = (daysRes.data ?? []).map((d: { id: string }) => d.id);
  const activitiesRes = dayIds.length
    ? await supabase.from('activities').select('*').in('day_id', dayIds)
    : empty;

  return {
    exported_at: new Date().toISOString(),
    format_version: 1,
    profile: profileRes.data,
    trips,
    days: daysRes.data ?? [],
    activities: activitiesRes.data ?? [],
    expenses: expensesRes.data ?? [],
    packing_items: packingRes.data ?? [],
    photos: photosRes.data ?? [],
  };
}
