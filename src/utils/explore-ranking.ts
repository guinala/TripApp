import type { ExplorePlace } from "../types/explore.ts";
import type { InterestCategory, LatLng } from "../types/place.ts";

export type ExploreAffinityWeights = {
  restaurant: number;
  visit: number;
  park: number;
};

export function adjustedRating(
  rating: number | null,
  count: number | null,
): number {
  if (rating == null || count == null || count <= 0) return 0;
  const prior = 3.5;
  const minimumEvidence = 30;
  return (count * rating + minimumEvidence * prior) / (count + minimumEvidence);
}

export function normalizeAffinities(
  input: ExploreAffinityWeights,
): ExploreAffinityWeights {
  const maximum = Math.max(input.restaurant, input.visit, input.park);
  if (!Number.isFinite(maximum) || maximum <= 0) {
    return { restaurant: 0, visit: 0, park: 0 };
  }
  return {
    restaurant: Math.max(0, input.restaurant) / maximum,
    visit: Math.max(0, input.visit) / maximum,
    park: Math.max(0, input.park) / maximum,
  };
}

export function chooseExploratoryCategory(
  weights: ExploreAffinityWeights,
): InterestCategory {
  if (weights.restaurant >= weights.park && weights.restaurant > 0) {
    return "restaurant";
  }
  if (weights.park > 0) return "park";
  return "museum";
}

const RESTAURANT_TYPES = new Set([
  "restaurant",
  "cafe",
  "bakery",
  "bar",
  "meal_takeaway",
]);
const VISIT_TYPES = new Set([
  "tourist_attraction",
  "museum",
  "monument",
  "historical_landmark",
  "cultural_landmark",
]);
const PARK_TYPES = new Set([
  "park",
  "national_park",
  "nature_preserve",
  "hiking_area",
]);

function affinity(
  place: ExplorePlace,
  weights: ExploreAffinityWeights,
): number {
  let result = 0;
  if (place.types.some((type) => RESTAURANT_TYPES.has(type))) {
    result = weights.restaurant;
  }
  if (place.types.some((type) => VISIT_TYPES.has(type))) {
    result = Math.max(result, weights.visit);
  }
  if (place.types.some((type) => PARK_TYPES.has(type))) {
    result = Math.max(result, weights.park);
  }
  return result;
}

function belongsToCategory(
  place: ExplorePlace,
  category: InterestCategory,
): boolean {
  if (category === "restaurant") {
    return place.types.some((type) => RESTAURANT_TYPES.has(type));
  }
  if (category === "park") {
    return place.types.some((type) => PARK_TYPES.has(type));
  }
  if (category === "museum") return place.types.includes("museum");
  return place.types.some((type) => VISIT_TYPES.has(type));
}

function distanceMeters(a: LatLng, b: LatLng): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const lat1 = radians(a.lat);
  const lat2 = radians(b.lat);
  const dLat = lat2 - lat1;
  const dLng = radians(b.lng - a.lng);
  const value = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function rankExplorePlaces(
  candidates: ExplorePlace[],
  affinityWeights: ExploreAffinityWeights,
  excludedIds: Iterable<string>,
  center: LatLng | null,
  exploratoryCategory: InterestCategory,
  limit = 12,
): ExplorePlace[] {
  const excluded = new Set(excludedIds);
  const seen = new Set<string>();
  const weights = normalizeAffinities(affinityWeights);
  const hasAffinity =
    Math.max(weights.restaurant, weights.visit, weights.park) > 0;

  const scored = candidates
    .map((place, index) => ({ place, index }))
    .filter(({ place }) => {
      if (excluded.has(place.placeId) || seen.has(place.placeId)) return false;
      seen.add(place.placeId);
      return true;
    })
    .map(({ place, index }) => {
      const quality = adjustedRating(place.rating, place.ratingCount) / 5;
      const preference = affinity(place, weights);
      const proximity = center && place.location
        ? Math.max(0, 1 - distanceMeters(center, place.location) / 5_000)
        : null;
      const providerRelevance = 1 - index / Math.max(candidates.length, 1);

      const hasRating = place.rating != null &&
        place.ratingCount != null &&
        place.ratingCount > 0;

      const parts = [
        { value: providerRelevance, weight: 0.15 },

        ...(hasRating
          ? [
            { value: quality, weight: 0.40 },
            {
              value: popularityScore(place.ratingCount),
              weight: 0.25,
            },
          ]
          : []),

        ...(hasAffinity ? [{ value: preference, weight: 0.15 }] : []),

        ...(proximity == null ? [] : [{ value: proximity, weight: 0.05 }]),
      ];
      const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0);
      const score = parts.reduce((sum, part) =>
        sum + part.value * part.weight, 0) / totalWeight;
      return { place, index, score };
    })
    .sort((a, b) =>
      b.score - a.score || a.index - b.index ||
      a.place.placeId.localeCompare(b.place.placeId)
    );

  const selected = scored.slice(0, limit);
  const exploratory = scored.filter(({ place }) =>
    belongsToCategory(place, exploratoryCategory)
  );
  const reserved = exploratory.slice(0, Math.min(2, limit));
  for (const candidate of reserved) {
    if (
      selected.some(({ place }) => place.placeId === candidate.place.placeId)
    ) continue;
    const replaceAt = selected.findLastIndex(
      ({ place }) => !belongsToCategory(place, exploratoryCategory),
    );
    if (replaceAt >= 0) selected[replaceAt] = candidate;
  }

  return selected
    .sort((a, b) =>
      b.score - a.score || a.index - b.index ||
      a.place.placeId.localeCompare(b.place.placeId)
    )
    .map(({ place }) => place);
}

export function popularityScore(count: number | null): number {
  if (count == null || !Number.isFinite(count) || count <= 0) {
    return 0;
  }

  return Math.min(
    1,
    Math.log1p(count) / Math.log1p(50_000),
  );
}

function normalizedName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function rankSearchPlaces(
  candidates: ExplorePlace[],
  query: string,
  mode: "cities" | "places",
): ExplorePlace[] {
  const unique = [
    ...new Map(
      candidates.map((place) => [place.placeId, place]),
    ).values(),
  ];

  const normalizedQuery = normalizedName(query);

  return unique
    .map((place, index) => {
      const exact = normalizedName(place.name) === normalizedQuery;
      const providerRelevance = 1 - index / Math.max(unique.length, 1);

      const score = mode === "cities" ? providerRelevance : (
        providerRelevance * 0.55 +
        (adjustedRating(place.rating, place.ratingCount) / 5) * 0.25 +
        popularityScore(place.ratingCount) * 0.20
      );

      return { place, index, exact, score };
    })
    .sort((a, b) =>
      Number(b.exact) - Number(a.exact) ||
      b.score - a.score ||
      a.index - b.index
    )
    .map(({ place }) => place);
}
