import { supabase } from './supabase';
import { Database } from '@/types/database';
import type { PackingItem, PackingCategory } from '@/types/packing';

type PackingRow = Database['public']['Tables']['packing_items']['Row'];

export type PackingItemInput = {
  tripId: string;
  name: string;
  category: PackingCategory;
  checked?: boolean;
};

export type PackingSeed = {
  name: string;
  category: PackingCategory;
  checked?: boolean;
};

// DB -> dominio
function toPackingItem(row: PackingRow): PackingItem {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    category: row.category as PackingCategory,
    checked: row.checked,
    createdAt: row.created_at,
  };
}

export async function listItems(tripId: string): Promise<PackingItem[]> {
  const { data, error } = await supabase
    .from('packing_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toPackingItem);
}

export async function createItem(input: PackingItemInput): Promise<PackingItem> {
  const { data, error } = await supabase
    .from('packing_items')
    .insert({
      trip_id: input.tripId,
      name: input.name,
      category: input.category,
      checked: input.checked ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return toPackingItem(data);
}

export async function toggleItem(id: string, checked: boolean): Promise<void> {
  const { error } = await supabase.from('packing_items').update({ checked }).eq('id', id);
  if (error) throw error;
}

export async function updateItem(
  id: string,
  data: { name?: string; category?: PackingCategory },
): Promise<void> {
  const { error } = await supabase
    .from('packing_items')
    .update({
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from('packing_items').delete().eq('id', id);
  if (error) throw error;
}

// 1 sola inserción para N ítems
export async function bulkInsert(tripId: string, items: PackingSeed[]): Promise<PackingItem[]> {
  if (items.length === 0) return [];

  const rows = items.map((it) => ({
    trip_id: tripId,
    name: it.name,
    category: it.category,
    checked: it.checked ?? false,
  }));

  const { data, error } = await supabase.from('packing_items').insert(rows).select();

  if (error) throw error;
  return (data ?? []).map(toPackingItem);
}

export async function clearItems(tripId: string): Promise<void> {
  const { error } = await supabase.from('packing_items').delete().eq('trip_id', tripId);
  if (error) throw error;
}
