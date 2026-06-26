import { Ionicons } from '@expo/vector-icons';
import type { ExpenseCategory } from '@/types/expense';

export const EXPENSE_ICON: Record<ExpenseCategory, keyof typeof Ionicons.glyphMap> = {
  food: 'restaurant',
  transport: 'airplane',
  stay: 'bed',
  leisure: 'star',
  other: 'ellipsis-horizontal',
};
