import type {
  BrowseResponse,
  BrowseSpec,
  ExploreMode,
  ExplorePlace,
  GooglePlacePhoto,
  PlaceContent,
  PriceLevel,
} from "../../../src/types/explore.ts";
import type {
  InterestCategory,
  LatLng,
  PlaceDetails,
  PlaceLanguage,
  PlacesDataByAction,
  PlacesErrorCode,
  PlacesRequest,
  PlaceSuggestion,
  PlaceSummary,
} from "../../../src/types/place.ts";
import {
  isCity,
  isGeographicDestination,
} from "../../../src/utils/place-kind.ts";

export class PlacesHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: PlacesErrorCode,
    public readonly retryable: boolean,
  ) {
    super(code);
    this.name = "PlacesHttpError";
  }
}

type ObjectValue = Record<string, unknown>;
type RequestOf<A extends PlacesRequest["action"]> = Extract<
  PlacesRequest,
  { action: A }
>;

const BASE = "https://places.googleapis.com/v1";

const DETAILS_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "viewport",
  "addressComponents",
  "types",
  "googleMapsUri",
  "attributions",
].join(",");

const SEARCH_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.types",
  "places.attributions",
].join(",");

const AUTOCOMPLETE_MASK = [
  "suggestions.placePrediction.placeId",
  "suggestions.placePrediction.text.text",
  "suggestions.placePrediction.structuredFormat.mainText.text",
  "suggestions.placePrediction.structuredFormat.secondaryText.text",
].join(",");

const EXPLORE_SEARCH_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.types",
  "places.primaryType",
  "places.addressComponents",
  "places.attributions",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.businessStatus",
];

const CONTENT_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "viewport",
  "addressComponents",
  "types",
  "googleMapsUri",
  "attributions",
  "rating",
  "userRatingCount",
  "priceLevel",
  "editorialSummary",
].join(",");

const PHOTO_METADATA_MASK = "id,photos";

const CATEGORY_TYPES: Record<InterestCategory, string[]> = {
  visit: ["tourist_attraction"],
  museum: ["museum"],
  park: ["park"],
  restaurant: ["restaurant"],
};

const PRICE_LEVELS: Record<string, PriceLevel> = {
  PRICE_LEVEL_FREE: "free",
  PRICE_LEVEL_INEXPENSIVE: "inexpensive",
  PRICE_LEVEL_MODERATE: "moderate",
  PRICE_LEVEL_EXPENSIVE: "expensive",
  PRICE_LEVEL_VERY_EXPENSIVE: "very_expensive",
};

function object(value: unknown): ObjectValue | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as ObjectValue)
    : undefined;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function invalidResponse(): never {
  throw new PlacesHttpError(502, "UPSTREAM_UNAVAILABLE", true);
}

function array(value: unknown): unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return invalidResponse();
  return value;
}

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function coordinates(value: unknown): LatLng | null {
  const point = object(value);
  if (!point) return null;
  const lat = finite(point.latitude);
  const lng = finite(point.longitude);
  if (lat == null || Math.abs(lat) > 90 || lng == null || Math.abs(lng) > 180) {
    return null;
  }
  return { lat, lng };
}

function attributions(value: unknown): PlaceDetails["attributions"] {
  return array(value).map((item) => {
    const attribution = object(item);
    const provider = text(attribution?.provider);
    if (!provider) return invalidResponse();
    return { provider, providerUri: text(attribution?.providerUri) };
  });
}

function addressPart(value: unknown, types: string[]): ObjectValue | undefined {
  return array(value)
    .map(object)
    .find((part) => {
      const partTypes = part?.types;
      return Array.isArray(partTypes) &&
        types.some((type) => partTypes.includes(type));
    });
}

function summary(value: unknown): PlaceSummary {
  const place = object(value);
  if (!place) return invalidResponse();
  const placeId = text(place.id);
  const name = text(object(place.displayName)?.text);
  if (!placeId || !name) return invalidResponse();
  const types = array(place.types);
  if (!types.every((type): type is string => typeof type === "string")) {
    return invalidResponse();
  }
  return {
    placeId,
    name,
    address: text(place.formattedAddress),
    location: coordinates(place.location),
    types,
    attributions: attributions(place.attributions),
  };
}

export function mapGoogleDetails(value: unknown): PlaceDetails {
  const place = object(value);
  if (!place) return invalidResponse();
  const base = summary(place);
  const bounds = object(place.viewport);
  const low = coordinates(bounds?.low);
  const high = coordinates(bounds?.high);
  const country = addressPart(place.addressComponents, ["country"]);
  const locality = addressPart(
    place.addressComponents,
    ["locality", "postal_town"],
  );
  const code = text(country?.shortText)?.toUpperCase();
  return {
    ...base,
    viewport: low && high && low.lat <= high.lat ? { low, high } : null,
    countryCode: code && /^[A-Z]{2}$/.test(code) ? code : null,
    countryName: text(country?.longText),
    localityName: text(locality?.longText),
    googleMapsUri: text(place.googleMapsUri),
  };
}

function mapPrice(value: unknown): PriceLevel | null {
  return typeof value === "string" ? (PRICE_LEVELS[value] ?? null) : null;
}

function validRating(value: unknown): number | null {
  const rating = finite(value);
  return rating != null && rating >= 1 && rating <= 5 ? rating : null;
}

function validCount(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

export function mapGoogleExplorePlace(value: unknown): ExplorePlace {
  const place = object(value);
  if (!place) return invalidResponse();
  const base = summary(place);
  const country = addressPart(place.addressComponents, ["country"]);
  const locality = addressPart(place.addressComponents, [
    "locality",
    "postal_town",
  ]);
  const code = text(country?.shortText)?.toUpperCase();
  return {
    ...base,
    rating: validRating(place.rating),
    ratingCount: validCount(place.userRatingCount),
    priceLevel: isGeographicDestination(base.types)
      ? null
      : mapPrice(place.priceLevel),
    countryCode: code && /^[A-Z]{2}$/.test(code) ? code : null,
    countryName: text(country?.longText),
    localityName: text(locality?.longText),
    primaryType: text(place.primaryType),
  };
}

export function mapGoogleContent(value: unknown): PlaceContent {
  const place = object(value);
  if (!place) return invalidResponse();
  const details = mapGoogleDetails(place);
  const rawDescription = object(place.editorialSummary);
  const descriptionText =
    typeof rawDescription?.text === "string" && rawDescription.text.trim()
      ? rawDescription.text
      : null;
  return {
    place: details,
    rating: validRating(place.rating),
    ratingCount: validCount(place.userRatingCount),
    priceLevel: isGeographicDestination(details.types)
      ? null
      : mapPrice(place.priceLevel),
    description: descriptionText
      ? {
        text: descriptionText,
        languageCode: text(rawDescription?.languageCode),
      }
      : null,
  };
}

function circle(center: LatLng, radius: number) {
  return {
    circle: { center: { latitude: center.lat, longitude: center.lng }, radius },
  };
}

function combinedSignal(external?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(8_000);
  return external ? AbortSignal.any([timeout, external]) : timeout;
}

async function fetchGoogle(
  url: string,
  apiKey: string,
  fieldMask: string | null,
  body?: ObjectValue,
  externalSignal?: AbortSignal,
): Promise<ObjectValue> {
  const signal = combinedSignal(externalSignal);
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    };
    if (fieldMask) headers["X-Goog-FieldMask"] = fieldMask;
    const response = await fetch(url, {
      method: body === undefined ? "GET" : "POST",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
    if (!response.ok) {
      console.error(
        JSON.stringify({
          event: "places_google_http_error",
          status: response.status,
        }),
      );
      if (response.status === 404) {
        throw new PlacesHttpError(404, "NOT_FOUND", false);
      }
      if (response.status === 400) {
        throw new PlacesHttpError(400, "INVALID_INPUT", false);
      }
      throw new PlacesHttpError(
        503,
        "UPSTREAM_UNAVAILABLE",
        response.status === 429 || response.status >= 500,
      );
    }
    const result = object(await response.json());
    if (!result) return invalidResponse();
    return result;
  } catch (error) {
    if (error instanceof PlacesHttpError) throw error;
    if (signal.aborted) {
      if (externalSignal?.aborted) {
        throw new PlacesHttpError(499, "TIMEOUT", true);
      }
      throw new PlacesHttpError(504, "TIMEOUT", true);
    }
    throw new PlacesHttpError(502, "UPSTREAM_UNAVAILABLE", true);
  }
}

function available(value: unknown): boolean {
  const status = text(object(value)?.businessStatus);
  return status == null || status === "OPERATIONAL";
}

function filterExplore(
  values: unknown[],
  mode: ExploreMode,
  countryCode?: string,
): ExplorePlace[] {
  return values
    .filter(available)
    .map(mapGoogleExplorePlace)
    .filter((place) =>
      mode === "cities"
        ? isCity(place.types)
        : !isGeographicDestination(place.types)
    )
    .filter((place) => !countryCode || place.countryCode === countryCode);
}

export async function googleAutocomplete(
  request: RequestOf<"autocomplete">,
  apiKey: string,
  signal?: AbortSignal,
): Promise<PlacesDataByAction["autocomplete"]> {
  const body: ObjectValue = {
    input: request.input,
    languageCode: request.languageCode,
    sessionToken: request.sessionToken,
    includeQueryPredictions: false,
  };
  if (request.scope === "destinations") {
    body.includedPrimaryTypes = [
      "locality",
      "administrative_area_level_1",
      "country",
    ];
  }
  if (request.center) body.locationBias = circle(request.center, 30_000);
  const result = await fetchGoogle(
    `${BASE}/places:autocomplete`,
    apiKey,
    AUTOCOMPLETE_MASK,
    body,
    signal,
  );
  const suggestions: PlaceSuggestion[] = array(result.suggestions).map(
    (item) => {
      const prediction = object(object(item)?.placePrediction);
      const structured = object(prediction?.structuredFormat);
      const placeId = text(prediction?.placeId);
      const mainText = text(object(structured?.mainText)?.text) ??
        text(object(prediction?.text)?.text);
      if (!placeId || !mainText) return invalidResponse();
      return {
        placeId,
        mainText,
        secondaryText: text(object(structured?.secondaryText)?.text) ?? "",
      };
    },
  );
  return { suggestions };
}

export async function googleDetails(
  request: RequestOf<"details">,
  apiKey: string,
  signal?: AbortSignal,
): Promise<PlacesDataByAction["details"]> {
  const url = new URL(`${BASE}/places/${encodeURIComponent(request.placeId)}`);
  url.searchParams.set("languageCode", request.languageCode);
  if (request.sessionToken) {
    url.searchParams.set("sessionToken", request.sessionToken);
  }
  const result = await fetchGoogle(
    url.toString(),
    apiKey,
    DETAILS_MASK,
    undefined,
    signal,
  );
  return { place: mapGoogleDetails(result) };
}

export async function googleNearby(
  request: RequestOf<"nearby">,
  apiKey: string,
  signal?: AbortSignal,
): Promise<PlacesDataByAction["nearby"]> {
  const result = await fetchGoogle(
    `${BASE}/places:searchNearby`,
    apiKey,
    SEARCH_MASK,
    {
      includedTypes: CATEGORY_TYPES[request.category],
      languageCode: request.languageCode,
      maxResultCount: 10,
      rankPreference: "POPULARITY",
      locationRestriction: circle(request.center, 5_000),
    },
    signal,
  );
  return { places: array(result.places).map(summary) };
}

export async function googleTextSearch(
  request: RequestOf<"textSearch">,
  apiKey: string,
  signal?: AbortSignal,
): Promise<PlacesDataByAction["textSearch"]> {
  const body: ObjectValue = {
    textQuery: request.query,
    languageCode: request.languageCode,
    pageSize: 10,
  };
  if (request.center) body.locationBias = circle(request.center, 30_000);
  if (request.pageToken) body.pageToken = request.pageToken;
  const result = await fetchGoogle(
    `${BASE}/places:searchText`,
    apiKey,
    `${SEARCH_MASK},nextPageToken`,
    body,
    signal,
  );
  return {
    places: array(result.places).map(summary),
    nextPageToken: text(result.nextPageToken),
  };
}

export async function googleBrowseText(
  search: Extract<BrowseSpec, { kind: "text" }>,
  languageCode: PlaceLanguage,
  apiKey: string,
  signal?: AbortSignal,
): Promise<BrowseResponse> {
  const body: ObjectValue = {
    textQuery: search.areaLabel
      ? `${search.query}, ${search.areaLabel}`
      : search.query,
    languageCode,
    pageSize: 20,
    ...(search.center ? { locationBias: circle(search.center, 30_000) } : {}),
  };
  if (search.pageToken) body.pageToken = search.pageToken;
  const result = await fetchGoogle(
    `${BASE}/places:searchText`,
    apiKey,
    `${EXPLORE_SEARCH_FIELDS.join(",")},nextPageToken`,
    body,
    signal,
  );
  return {
    places: filterExplore(
      array(result.places),
      search.mode,
      search.countryCode,
    ),
    nextPageToken: text(result.nextPageToken),
  };
}

export async function googleBrowseNearby(
  center: LatLng,
  category: InterestCategory,
  languageCode: PlaceLanguage,
  apiKey: string,
  signal?: AbortSignal,
): Promise<BrowseResponse> {
  const result = await fetchGoogle(
    `${BASE}/places:searchNearby`,
    apiKey,
    EXPLORE_SEARCH_FIELDS.join(","),
    {
      includedTypes: CATEGORY_TYPES[category],
      languageCode,
      maxResultCount: 10,
      rankPreference: "POPULARITY",
      locationRestriction: circle(center, 5_000),
    },
    signal,
  );
  return {
    places: filterExplore(array(result.places), "places"),
    nextPageToken: null,
  };
}

export async function googleDiscoverCities(
  countryName: string,
  countryCode: string,
  languageCode: PlaceLanguage,
  apiKey: string,
  signal?: AbortSignal,
): Promise<ExplorePlace[]> {
  const result = await fetchGoogle(
    `${BASE}/places:searchText`,
    apiKey,
    EXPLORE_SEARCH_FIELDS.join(","),
    {
      textQuery: `cities in ${countryName}`,
      languageCode,
      pageSize: 20,
    },
    signal,
  );
  return filterExplore(array(result.places), "cities", countryCode);
}

export async function googleNearbyCities(
  center: LatLng,
  languageCode: PlaceLanguage,
  apiKey: string,
  signal?: AbortSignal,
): Promise<ExplorePlace[]> {
  const result = await fetchGoogle(
    `${BASE}/places:searchNearby`,
    apiKey,
    EXPLORE_SEARCH_FIELDS.join(","),
    {
      includedTypes: ["locality"],
      languageCode,
      maxResultCount: 20,
      rankPreference: "DISTANCE",
      locationRestriction: circle(center, 50_000),
    },
    signal,
  );
  return filterExplore(array(result.places), "cities");
}

export async function googleContent(
  placeId: string,
  languageCode: PlaceLanguage,
  apiKey: string,
  signal?: AbortSignal,
): Promise<PlaceContent> {
  const url = new URL(`${BASE}/places/${encodeURIComponent(placeId)}`);
  url.searchParams.set("languageCode", languageCode);
  return mapGoogleContent(
    await fetchGoogle(url.toString(), apiKey, CONTENT_MASK, undefined, signal),
  );
}

export async function googlePhoto(
  placeId: string,
  size: "card" | "hero",
  apiKey: string,
  signal?: AbortSignal,
): Promise<GooglePlacePhoto | null> {
  const detailsUrl = `${BASE}/places/${encodeURIComponent(placeId)}`;
  const metadata = await fetchGoogle(
    detailsUrl,
    apiKey,
    PHOTO_METADATA_MASK,
    undefined,
    signal,
  );
  if (text(metadata.id) !== placeId) return invalidResponse();
  const prefix = `places/${placeId}/photos/`;
  const photo = array(metadata.photos)
    .map(object)
    .find((candidate) => text(candidate?.name)?.startsWith(prefix));
  if (!photo) return null;
  const name = text(photo.name);
  if (!name || !name.startsWith(prefix)) return invalidResponse();
  const mediaUrl = new URL(`${BASE}/${name}/media`);
  mediaUrl.searchParams.set("maxWidthPx", size === "card" ? "480" : "1200");
  mediaUrl.searchParams.set("skipHttpRedirect", "true");
  const media = await fetchGoogle(
    mediaUrl.toString(),
    apiKey,
    null,
    undefined,
    signal,
  );
  const uri = text(media.photoUri);
  if (!uri || !uri.startsWith("https://")) return invalidResponse();
  const credits = array(photo.authorAttributions).map((value) => {
    const author = object(value);
    const displayName = text(author?.displayName);
    if (!displayName) return invalidResponse();
    return { name: displayName, uri: text(author?.uri) };
  });
  return {
    placeId,
    uri,
    widthPx: validCount(photo.widthPx),
    heightPx: validCount(photo.heightPx),
    credits,
  };
}
