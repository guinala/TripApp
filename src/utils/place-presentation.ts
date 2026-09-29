import type { PriceLevel } from "../types/explore.ts";

import { isCity, isGeographicDestination } from "./place-kind.ts";
import type { LatLng } from "../types/place.ts";

export const MISSING_PLACE_VALUE = "-";

export function formatPlaceRating(
  value: number | null,
  language: string,
): string {
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
  return description && description.text.trim()
    ? description.text
    : unavailable;
}

function geographicEntity(types: string[]): boolean {
  return (
    isGeographicDestination(types) &&
    !types.includes("point_of_interest") &&
    !types.includes("establishment")
  );
}

export function shouldShowRating(
  types: string[],
  rating: number | null,
): boolean {
  return (
    !geographicEntity(types) &&
    rating != null &&
    Number.isFinite(rating) &&
    rating >= 1 &&
    rating <= 5
  );
}

export function shouldShowWeather(
  types: string[],
  location: LatLng | null,
): boolean {
  return geographicEntity(types) && isCity(types) && !!location;
}

export function placeCategoryKey(types: string[]): string {
  if (geographicEntity(types)) {
    if (types.includes("country")) return "country";
    if (isCity(types)) return "city";
    return "region";
  }

  if (
    types.some((type) =>
      [
        "museum",
        "monument",
        "historical_landmark",
        "cultural_landmark",
        "art_gallery",
      ].includes(type)
    )
  ) {
    return "cultural";
  }

  if (
    types.some((type) =>
      [
        "restaurant",
        "cafe",
        "bakery",
        "bar",
      ].includes(type)
    )
  ) {
    return "food";
  }

  if (
    types.some((type) =>
      [
        "park",
        "national_park",
        "nature_preserve",
        "hiking_area",
        "beach",
      ].includes(type)
    )
  ) {
    return "nature";
  }

  if (types.includes("tourist_attraction")) return "sight";

  return "place";
}

export function placeLocationLabel(place: {
  types: string[];
  countryName?: string | null;
  localityName?: string | null;
}): string {
  if (
    geographicEntity(place.types) &&
    place.types.includes("country")
  ) {
    return "";
  }

  if (geographicEntity(place.types)) {
    return place.countryName ?? "";
  }

  return [
    ...new Set(
      [place.localityName, place.countryName]
        .filter((value): value is string => !!value?.trim()),
    ),
  ].join(", ");
}
