import { Ionicons } from '@expo/vector-icons';
import type { ActivityCategory } from '@/types/activity';

export const ACTIVITY_ICON: Record<ActivityCategory, keyof typeof Ionicons.glyphMap> = {
  visit: 'camera',
  restaurant: 'restaurant',
  transport: 'airplane',
  hotel: 'bed',
  entertainment: 'musical-notes',
  others: 'ellipsis-horizontal',
};
