import {
  accountVersion,
  assertAccount,
  isCurrentAccount,
  subscribeAccount,
} from '@/services/account-session';
import { create } from 'zustand';
import type { Expense } from '@/types/expense';
import {
  createExpense,
  type CreateExpenseInput,
  deleteExpense,
  listExpenses,
  updateExpense,
} from '@/services/expenses';
import i18n from '@/i18n';

type EditPatch = Partial<Omit<CreateExpenseInput, 'tripId'>>;

type ExpenseState = {
  // Gastos indexados por tripId
  byTrip: Record<string, Expense[]>;
  loadingByTrip: Record<string, boolean>;
  error: string | null;
  errorByTrip: Record<string, string | null>;

  loadExpenses: (tripId: string) => Promise<void>;
  addExpense: (input: CreateExpenseInput) => Promise<void>;
  editExpense: (tripId: string, id: string, patch: EditPatch) => Promise<void>;
  removeExpense: (tripId: string, id: string) => Promise<void>;
};

const sortByDateDesc = (list: Expense[]): Expense[] =>
  [...list].sort((a, b) => b.date.localeCompare(a.date));

type TripRequests = {
  request: number;
  revision: number;
  pending: number;
  idle: Promise<void>;
  release?: () => void;
};
const requests = new Map<string, TripRequests>();

function requestsFor(tripId: string): TripRequests {
  let state = requests.get(tripId);
  if (!state) {
    state = { request: 0, revision: 0, pending: 0, idle: Promise.resolve() };
    requests.set(tripId, state);
  }
  return state;
}

function beginMutation(tripId: string) {
  const state = requestsFor(tripId);
  state.revision++;
  if (state.pending++ === 0) {
    state.idle = new Promise<void>((resolve) => {
      state.release = resolve;
    });
  }
  return () => {
    if (--state.pending === 0) state.release?.();
  };
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  errorByTrip: {},
  byTrip: {},
  loadingByTrip: {},
  error: null,

  loadExpenses: async (tripId) => {
    const started = accountVersion();
    if (!isCurrentAccount(started)) return;
    const state = requestsFor(tripId);
    const request = ++state.request;
    const current = () => isCurrentAccount(started) && request === state.request;

    set((s) => ({
      loadingByTrip: { ...s.loadingByTrip, [tripId]: true },
      errorByTrip: { ...s.errorByTrip, [tripId]: null },
      error: null,
    }));

    while (current()) {
      // No leer una instantánea a medio guardar. Si hubo cambios durante la lectura,
      // repetirla tras terminar las escrituras, sin retirar los elementos optimistas.
      while (state.pending && current()) await state.idle;
      if (!current()) return;
      const revision = state.revision;
      try {
        const expenses = await listExpenses(tripId);
        if (!current()) return;
        if (revision !== state.revision || state.pending) continue;
        set((s) => ({
          byTrip: { ...s.byTrip, [tripId]: expenses },
          loadingByTrip: { ...s.loadingByTrip, [tripId]: false },
          errorByTrip: { ...s.errorByTrip, [tripId]: null },
        }));
        return;
      } catch (err) {
        if (!current()) return;
        if (revision !== state.revision || state.pending) continue;
        set((s) => ({
          loadingByTrip: { ...s.loadingByTrip, [tripId]: false },
          error: err instanceof Error ? err.message : i18n.t('errors.loadExpenses'),
          errorByTrip: { ...s.errorByTrip, [tripId]: 'load' },
        }));
        return;
      }
    }
  },

  addExpense: async (input) => {
    const started = accountVersion();
    assertAccount(started);

    const { tripId } = input;
    const finish = beginMutation(tripId);
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
      assertAccount(started);
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
      assertAccount(started);

      // Se elimina el temporal
      set((s) => ({
        byTrip: {
          ...s.byTrip,
          [tripId]: (s.byTrip[tripId] ?? []).filter((e) => e.id !== tempId),
        },
        error: err instanceof Error ? err.message : i18n.t('errors.createExpense'),
      }));
      throw err;
    } finally {
      finish();
    }
  },

  editExpense: async (tripId, id, patch) => {
    const started = accountVersion();
    assertAccount(started);
    const finish = beginMutation(tripId);

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
      assertAccount(started);
      set((s) => ({
        byTrip: {
          ...s.byTrip,
          [tripId]: sortByDateDesc((s.byTrip[tripId] ?? []).map((e) => (e.id === id ? saved : e))),
        },
      }));
    } catch (err) {
      assertAccount(started);

      set((s) => ({
        byTrip: { ...s.byTrip, [tripId]: snapshot },
        error: err instanceof Error ? err.message : i18n.t('errors.updateExpense'),
      }));
      throw err;
    } finally {
      finish();
    }
  },

  removeExpense: async (tripId, id) => {
    const started = accountVersion();
    assertAccount(started);
    const finish = beginMutation(tripId);

    const snapshot = get().byTrip[tripId] ?? [];
    set((s) => ({
      byTrip: { ...s.byTrip, [tripId]: snapshot.filter((e) => e.id !== id) },
      error: null,
    }));

    try {
      await deleteExpense(id);
      assertAccount(started);
    } catch (err) {
      assertAccount(started);

      set((s) => ({
        byTrip: { ...s.byTrip, [tripId]: snapshot },
        error: err instanceof Error ? err.message : i18n.t('errors.deleteExpense'),
      }));
      throw err;
    } finally {
      finish();
    }
  },
}));

subscribeAccount(() => {
  requests.forEach((state) => state.release?.());
  requests.clear();
  useExpenseStore.setState({
    byTrip: {},
    loadingByTrip: {},
    error: null,
    errorByTrip: {},
  });
});
