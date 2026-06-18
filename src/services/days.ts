import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { supabase } from '@/services/supabase';
import type { Day } from '@/types/day';
import type { Trip } from '@/types/trip';

type DayRow = {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  title: string | null;
  notes: string | null;
};

function toDay(row: DayRow): Day {
  return {
    id: row.id,
    tripId: row.trip_id,
    dayNumber: row.day_number,
    date: row.date,
    title: row.title,
    notes: row.notes,
  };
}

export async function listDays(tripId: string): Promise<Day[]> {
  const { data, error } = await supabase
    .from('days')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_number', { ascending: true });

  if (error) throw error;
  return (data as DayRow[]).map(toDay);
}

export async function ensureDays(trip: Trip): Promise<Day[]> {
  const existing = await listDays(trip.id);
  if (existing.length > 0) return existing;

  const dates = eachDayOfInterval({
    start: parseISO(trip.startDate),
    end: parseISO(trip.endDate),
  });

  const rows = dates.map((date, i) => ({
    trip_id: trip.id,
    day_number: i + 1,
    // Fecha local a UTC
    date: format(date, 'yyyy-MM-dd'),
  }));

  const { error } = await supabase.from('days').insert(rows);
  if (error) throw error;

  return listDays(trip.id);
}
