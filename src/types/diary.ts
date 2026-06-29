import { spacing } from '@/constants/theme';

export type DiaryView = 'grid' | 'timeline' | 'map';

export const DIARY_VIEWS: { key: DiaryView; label: string }[] = [
  { key: 'grid', label: 'Grid' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'map', label: 'Mapa' },
];

export const DIARY_MOSAIC_COLUMNS = 3;
export const DIARY_MOSAIC_GAP = spacing.s2;

export type GridSlot = { colSpan: 1 | 2; rowSpan: 1 | 2 };

export const DIARY_GRID_SLOTS: GridSlot[] = [
  { colSpan: 2, rowSpan: 2 }, // foto destacada
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
];

export const DIARY_MOSAIC_OVERFLOW_SLOT: GridSlot = { colSpan: 1, rowSpan: 1 };
