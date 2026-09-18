import { placeSessionVersion } from "@/services/place-session";
import { supabase } from "@/services/supabase";
import type { Day } from "@/types/day";
import type { Trip } from "@/types/trip";

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
    .from("days")
    .select("*")
    .eq("trip_id", tripId)
    .order("day_number", { ascending: true });

  if (error) throw error;
  return (data as DayRow[]).map(toDay);
}

async function createMissingDays(trip: Trip): Promise<Day[]> {
  const { data, error } = await supabase.rpc("ensure_trip_days", {
    p_trip_id: trip.id,
  });
  if (error) throw error;
  return (data ?? []).map(toDay);
}

// La concurrencia entre dispositivos se resuelve mediante bloqueo de la fila trips dentro del RPC.
const pendingDays = new Map<string, Promise<Day[]>>();
export function ensureDays(trip: Trip): Promise<Day[]> {
  const key = JSON.stringify([
    trip.id,
    trip.startDate,
    trip.endDate,
    placeSessionVersion(),
  ]);
  const pending = pendingDays.get(key);
  if (pending) return pending;
  const promise = createMissingDays(trip);
  pendingDays.set(key, promise);
  const cleanup = () => {
    if (pendingDays.get(key) === promise) pendingDays.delete(key);
  };
  void promise.then(cleanup, cleanup);
  return promise;
}
