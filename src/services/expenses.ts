import { Expense, ExpenseCategory, ExpenseRow } from "@/types/expense";
import { supabase } from "./supabase";

export type CreateExpenseInput = {
  tripId: string;
  dayId?: string | null;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description?: string | null;
  date: string;
  receiptPath?: string | null;
};

function mapRowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    tripId: row.trip_id,
    dayId: row.day_id,
    amount: Number(row.amount),
    currency: row.currency,
    category: row.category as ExpenseCategory,
    description: row.description,
    date: row.date,
    receiptPath: row.receipt_path,
    createdAt: row.created_at,
  };
}

export async function listExpenses(tripId: string): Promise<Expense[]> {
  const rows: ExpenseRow[] = [];
  for (let offset = 0;; offset += 200) {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("trip_id", tripId)
      .order("date", { ascending: false })
      .order("id")
      .range(offset, offset + 199);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 200) break;
  }
  return rows.map(mapRowToExpense);
}

export async function getExpense(
  tripId: string,
  id: string,
): Promise<Expense | null> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", id)
    .eq("trip_id", tripId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRowToExpense(data) : null;
}

export async function createExpense(
  input: CreateExpenseInput,
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      trip_id: input.tripId,
      day_id: input.dayId ?? null,
      amount: input.amount,
      currency: input.currency,
      category: input.category,
      description: input.description ?? null,
      date: input.date,
      receipt_path: input.receiptPath ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRowToExpense(data);
}

export async function updateExpense(
  id: string,
  patch: Partial<Omit<CreateExpenseInput, "tripId">>,
): Promise<Expense> {
  const row: Partial<ExpenseRow> = {};
  if (patch.amount !== undefined) row.amount = patch.amount;
  if (patch.currency !== undefined) row.currency = patch.currency;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.dayId !== undefined) row.day_id = patch.dayId;
  if (patch.receiptPath !== undefined) row.receipt_path = patch.receiptPath;

  const { data, error } = await supabase
    .from("expenses")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapRowToExpense(data);
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}
