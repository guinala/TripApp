// src/store/expenseStore.ts
import { create } from 'zustand';
import type { Expense } from '@/types/expense';
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  type CreateExpenseInput,
} from '@/services/expenses';
import i18n from '@/i18n';

type EditPatch = Partial<Omit<CreateExpenseInput, 'tripId'>>;

type ExpenseState = {
  // Gastos indexados por tripId
  byTrip: Record<string, Expense[]>;
  loadingByTrip: Record<string, boolean>;
  error: string | null;

  loadExpenses: (tripId: string) => Promise<void>;
  addExpense: (input: CreateExpenseInput) => Promise<void>;
  editExpense: (tripId: string, id: string, patch: EditPatch) => Promise<void>;
  removeExpense: (tripId: string, id: string) => Promise<void>;
};

const sortByDateDesc = (list: Expense[]): Expense[] =>
  [...list].sort((a, b) => b.date.localeCompare(a.date));

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  byTrip: {},
  loadingByTrip: {},
  error: null,

  loadExpenses: async (tripId) => {
    set((s) => ({
      loadingByTrip: { ...s.loadingByTrip, [tripId]: true },
      error: null,
    }));
    try {
      const expenses = await listExpenses(tripId);
      set((s) => ({
        byTrip: { ...s.byTrip, [tripId]: expenses },
        loadingByTrip: { ...s.loadingByTrip, [tripId]: false },
      }));
    } catch (err) {
      set((s) => ({
        loadingByTrip: { ...s.loadingByTrip, [tripId]: false },
        error: err instanceof Error ? err.message : i18n.t('errors.loadExpenses'),
      }));
    }
  },

  addExpense: async (input) => {
    const { tripId } = input;
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: Expense = {
      id: tempId,
      tripId,
      dayId: input.dayId ?? null,
      amount: input.amount,
      currency: input.currency,
      category: input.category,
      description: input.description ?? null,
      date: input.date,
      receiptPath: input.receiptPath ?? null,
      createdAt: new Date().toISOString(),
    };

    const prev = get().byTrip[tripId] ?? [];
    set((s) => ({
      byTrip: { ...s.byTrip, [tripId]: sortByDateDesc([optimistic, ...prev]) },
      error: null,
    }));

    try {
      const saved = await createExpense(input);
      // Temporal por el real
      set((s) => ({
        byTrip: {
          ...s.byTrip,
          [tripId]: sortByDateDesc(
            (s.byTrip[tripId] ?? []).map((e) => (e.id === tempId ? saved : e)),
          ),
        },
      }));
    } catch (err) {
      // Quitamos el temporal
      set((s) => ({
        byTrip: {
          ...s.byTrip,
          [tripId]: (s.byTrip[tripId] ?? []).filter((e) => e.id !== tempId),
        },
        error: err instanceof Error ? err.message : i18n.t('errors.createExpense'),
      }));
      throw err;
    }
  },

  editExpense: async (tripId, id, patch) => {
    const snapshot = get().byTrip[tripId] ?? [];
    set((s) => ({
      byTrip: {
        ...s.byTrip,
        [tripId]: sortByDateDesc(snapshot.map((e) => (e.id === id ? { ...e, ...patch } : e))),
      },
      error: null,
    }));

    try {
      const saved = await updateExpense(id, patch);
      set((s) => ({
        byTrip: {
          ...s.byTrip,
          [tripId]: sortByDateDesc((s.byTrip[tripId] ?? []).map((e) => (e.id === id ? saved : e))),
        },
      }));
    } catch (err) {
      set((s) => ({
        byTrip: { ...s.byTrip, [tripId]: snapshot }, // Lista previa
        error: err instanceof Error ? err.message : i18n.t('errors.updateExpense'),
      }));
      throw err;
    }
  },

  removeExpense: async (tripId, id) => {
    const snapshot = get().byTrip[tripId] ?? [];
    set((s) => ({
      byTrip: { ...s.byTrip, [tripId]: snapshot.filter((e) => e.id !== id) },
      error: null,
    }));

    try {
      await deleteExpense(id);
    } catch (err) {
      set((s) => ({
        byTrip: { ...s.byTrip, [tripId]: snapshot }, // Lista previa
        error: err instanceof Error ? err.message : i18n.t('errors.deleteExpense'),
      }));
      throw err;
    }
  },
}));
