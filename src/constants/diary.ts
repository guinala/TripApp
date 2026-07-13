export type DiaryView = 'grid' | 'timeline' | 'map';

// labelKey es clave i18n: renderiza con t(view.labelKey)
export const DIARY_VIEWS: { key: DiaryView; labelKey: string }[] = [
  { key: 'grid', labelKey: 'diary.views.grid' },
  { key: 'timeline', labelKey: 'diary.views.timeline' },
  { key: 'map', labelKey: 'diary.views.map' },
];

export const DIARY_MOSAIC_COLUMNS = 3;
export const DIARY_MOSAIC_GAP = 10;

export type MosaicSlot = { colSpan: 1 | 2; rowSpan: 1 | 2 };

export const DIARY_MOSAIC_SLOTS: MosaicSlot[] = [
  { colSpan: 2, rowSpan: 2 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
];

export const DIARY_MOSAIC_OVERFLOW_SLOT: MosaicSlot = { colSpan: 1, rowSpan: 1 };
