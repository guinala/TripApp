import { Database } from './database';

export type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
export type ExpenseCategory = 'transport' | 'food' | 'stay' | 'leisure' | 'other';

export type Expense = {
  id: string;
  tripId: string;
  dayId: string | null;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string | null;
  date: string;
  receiptPath: string | null;
  createdAt: string;
};
