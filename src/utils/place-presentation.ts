import type { PriceLevel } from '../types/explore.ts';

export const MISSING_PLACE_VALUE = '-';

export function formatPlaceRating(value: number | null, language: string): string {
  if (value == null || !Number.isFinite(value)) return MISSING_PLACE_VALUE;
  return new Intl.NumberFormat(language, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function priceTranslationKey(level: PriceLevel | null): string | null {
  return level == null ? null : `dynamicExplore.price.${level}`;
}

export function descriptionText(
  description: { text: string } | null,
  unavailable: string,
): string {
  return description && description.text.trim() ? description.text : unavailable;
}
