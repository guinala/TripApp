import {
  InterestCategory,
  LatLng,
  PlaceDetails,
  PlaceLanguage,
  PlaceScope,
  PlacesDataByAction,
  PlacesErrorCode,
  PlacesRequest,
  PlaceSuggestion,
  PlaceSummary,
} from "@/types/place";
import type {
  BrowseResponse,
  BrowseSpec,
  DiscoveryResponse,
  ExplorePlace,
  ExploreRequest,
  GooglePlacePhoto,
  PlaceContent,
} from "@/types/explore";
import { supabase } from "./supabase";
import { FunctionsHttpError } from "@supabase/supabase-js";

export type { PlaceDetails, PlaceSuggestion } from "@/types/place";
export type RequestOptions = { signal?: AbortSignal };
type ClientCode =
  | PlacesErrorCode
  | "NETWORK_ERROR"
  | "INVALID_RESPONSE"
  | "CANCELLED";

export class PlacesError extends Error {
  constructor(
    public readonly code: ClientCode,
    public readonly retryable = false,
    public readonly status = 0,
    public readonly retryAfter?: number,
  ) {
    super(code);
    this.name = "PlacesError";
  }
}

export const isPlacesCancelled = (error: unknown) =>
  error instanceof PlacesError && error.code === "CANCELLED";

const codes = new Set<string>([
  "INVALID_INPUT",
  "UNAUTHENTICATED",
  "RATE_LIMITED",
  "NOT_FOUND",
  "UPSTREAM_UNAVAILABLE",
  "TIMEOUT",
  "REFERENCE_SAVE_FAILED",
]);

const obj = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const nullableText = (value: unknown) =>
  value === null || typeof value === "string";

const point = (value: unknown) =>
  obj(value) &&
  typeof value.lat === "number" &&
  Number.isFinite(value.lat) &&
  Math.abs(value.lat) <= 90 &&
  typeof value.lng === "number" &&
  Number.isFinite(value.lng) &&
  Math.abs(value.lng) <= 180;

function summary(value: unknown): boolean {
  return (
    obj(value) &&
    typeof value.placeId === "string" &&
    !!value.placeId &&
    typeof value.name === "string" &&
    !!value.name &&
    nullableText(value.address) &&
    (value.location === null || point(value.location)) &&
    Array.isArray(value.types) &&
    value.types.every((t) => typeof t === "string") &&
    Array.isArray(value.attributions) &&
    value.attributions.every(
      (a) =>
        obj(a) && typeof a.provider === "string" && nullableText(a.providerUri),
    )
  );
}

const priceLevels = new Set([
  "free",
  "inexpensive",
  "moderate",
  "expensive",
  "very_expensive",
]);

function metrics(value: Record<string, unknown>): boolean {
  return (
    (value.rating === null ||
      (typeof value.rating === "number" &&
        Number.isFinite(value.rating) &&
        value.rating >= 1 &&
        value.rating <= 5)) &&
    (value.ratingCount === null ||
      (typeof value.ratingCount === "number" &&
        Number.isInteger(value.ratingCount) &&
        value.ratingCount >= 0)) &&
    (value.priceLevel === null ||
      (typeof value.priceLevel === "string" &&
        priceLevels.has(value.priceLevel)))
  );
}

function explorePlace(value: unknown): value is ExplorePlace {
  return (
    obj(value) &&
    summary(value) &&
    metrics(value) &&
    nullableText(value.countryCode) &&
    nullableText(value.countryName) &&
    nullableText(value.localityName) &&
    nullableText(value.primaryType)
  );
}

function placeDetails(value: unknown): boolean {
  if (!obj(value)) return false;
  return (
    summary(value) &&
    nullableText(value.countryCode) &&
    nullableText(value.countryName) &&
    nullableText(value.googleMapsUri) &&
    (value.localityName === undefined || nullableText(value.localityName)) &&
    (value.viewport === null ||
      (obj(value.viewport) && point(value.viewport.low) &&
        point(value.viewport.high)))
  );
}

function resolvedArea(value: unknown): boolean {
  return (
    obj(value) &&
    typeof value.label === "string" &&
    !!value.label &&
    (value.countryCode === null ||
      (typeof value.countryCode === "string" &&
        /^[A-Z]{2}$/.test(value.countryCode))) &&
    nullableText(value.countryName) &&
    (value.center === null || point(value.center)) &&
    ["manual", "active_trip", "upcoming_trip", "past_trip", "device", "default"]
      .includes(
        String(value.source),
      )
  );
}

function content(value: unknown): value is PlaceContent {
  return (
    obj(value) &&
    placeDetails(value.place) &&
    metrics(value) &&
    (value.description === null ||
      (obj(value.description) &&
        typeof value.description.text === "string" &&
        !!value.description.text.trim() &&
        nullableText(value.description.languageCode)))
  );
}

function photo(value: unknown): value is GooglePlacePhoto {
  return (
    obj(value) &&
    typeof value.placeId === "string" &&
    !!value.placeId &&
    typeof value.uri === "string" &&
    value.uri.startsWith("https://") &&
    (value.widthPx === null ||
      (typeof value.widthPx === "number" && Number.isInteger(value.widthPx) &&
        value.widthPx >= 0)) &&
    (value.heightPx === null ||
      (typeof value.heightPx === "number" && Number.isInteger(value.heightPx) &&
        value.heightPx >= 0)) &&
    Array.isArray(value.credits) &&
    value.credits.every(
      (credit) =>
        obj(credit) && typeof credit.name === "string" &&
        nullableText(credit.uri),
    )
  );
}

function validData(action: PlacesRequest["action"], value: unknown): boolean {
  if (!obj(value)) return false;

  if (action === "autocomplete") {
    return (
      Array.isArray(value.suggestions) &&
      value.suggestions.every(
        (s) =>
          obj(s) &&
          typeof s.placeId === "string" &&
          !!s.placeId &&
          typeof s.mainText === "string" &&
          typeof s.secondaryText === "string",
      )
    );
  }

  if (action === "details") {
    return placeDetails(value.place);
  }

  if (action === "discover") {
    return (
      resolvedArea(value.area) &&
      [
        "new_cities",
        "nearby_cities",
        "for_trip",
        "based_on_history",
        "popular_in_area",
      ].includes(
        String(value.reason),
      ) &&
      Array.isArray(value.places) &&
      value.places.every(explorePlace) &&
      typeof value.partial === "boolean"
    );
  }

  if (action === "browse") {
    return (
      Array.isArray(value.places) &&
      value.places.every(explorePlace) &&
      nullableText(value.nextPageToken)
    );
  }

  if (action === "content") return content(value.content);

  if (action === "photo") return value.photo === null || photo(value.photo);

  return (
    Array.isArray(value.places) &&
    value.places.every(summary) &&
    (action !== "textSearch" || nullableText(value.nextPageToken))
  );
}

async function invoke<A extends PlacesRequest["action"]>(
  body: Extract<PlacesRequest, { action: A }>,
  options: RequestOptions = {},
): Promise<PlacesDataByAction[A]> {
  if (options.signal?.aborted) throw new PlacesError("CANCELLED");
  try {
    const { data, error } = await supabase.functions.invoke("places", {
      body,
      signal: options.signal,
    });
    if (options.signal?.aborted) throw new PlacesError("CANCELLED");
    if (error instanceof FunctionsHttpError) {
      const response = error.context as Response;
      const payload: unknown = await response
        .clone()
        .json()
        .catch(() => null);
      if (
        obj(payload) &&
        obj(payload.error) &&
        typeof payload.error.code === "string" &&
        codes.has(payload.error.code)
      ) {
        const retryHeader = response.headers.get("Retry-After");
        const retryAfter = retryHeader == null
          ? undefined
          : Number(retryHeader);
        throw new PlacesError(
          payload.error.code as PlacesErrorCode,
          payload.error.retryable === true,
          response.status,
          retryAfter !== undefined && Number.isFinite(retryAfter)
            ? retryAfter
            : undefined,
        );
      }

      throw new PlacesError(
        response.status === 401 ? "UNAUTHENTICATED" : "UPSTREAM_UNAVAILABLE",
        response.status >= 500 || response.status === 429,
        response.status,
      );
    }
    if (error) throw new PlacesError("NETWORK_ERROR", true);
    if (!obj(data) || !validData(body.action, data.data)) {
      throw new PlacesError("INVALID_RESPONSE", true);
    }
    return data.data as PlacesDataByAction[A];
  } catch (error) {
    if (options.signal?.aborted) throw new PlacesError("CANCELLED");
    if (error instanceof PlacesError) throw error;
    throw new PlacesError("NETWORK_ERROR", true);
  }
}

export async function autocompletePlaces(
  input: string,
  sessionToken: string,
  options: RequestOptions & {
    scope: PlaceScope;
    languageCode: PlaceLanguage;
    center?: LatLng;
  },
): Promise<PlaceSuggestion[]> {
  return (
    await invoke<"autocomplete">(
      {
        action: "autocomplete",
        input,
        sessionToken,
        scope: options.scope,
        languageCode: options.languageCode,
        ...(options.center ? { center: options.center } : {}),
      },
      options,
    )
  ).suggestions;
}

export async function getPlaceDetails(
  placeId: string,
  options: RequestOptions & {
    languageCode: PlaceLanguage;
    sessionToken?: string;
  },
): Promise<PlaceDetails> {
  const place = (
    await invoke<"details">(
      {
        action: "details",
        placeId,
        languageCode: options.languageCode,
        ...(options.sessionToken ? { sessionToken: options.sessionToken } : {}),
      },
      options,
    )
  ).place;
  if (place.placeId !== placeId) {
    throw new PlacesError("INVALID_RESPONSE", true);
  }
  return place;
}

export async function searchNearbyPlaces(
  center: LatLng,
  category: InterestCategory,
  options: RequestOptions & { languageCode: PlaceLanguage },
): Promise<PlaceSummary[]> {
  return (
    await invoke<"nearby">(
      {
        action: "nearby",
        center,
        category,
        languageCode: options.languageCode,
      },
      options,
    )
  ).places;
}

export async function searchPlacesByText(
  query: string,
  options: RequestOptions & {
    languageCode: PlaceLanguage;
    center?: LatLng;
    pageToken?: string;
  },
): Promise<PlacesDataByAction["textSearch"]> {
  return invoke<"textSearch">(
    {
      action: "textSearch",
      query,
      languageCode: options.languageCode,
      ...(options.center ? { center: options.center } : {}),
      ...(options.pageToken ? { pageToken: options.pageToken } : {}),
    },
    options,
  );
}

export async function discoverPlaces(
  request: Omit<Extract<ExploreRequest, { action: "discover" }>, "action">,
  options: RequestOptions = {},
): Promise<DiscoveryResponse> {
  return invoke<"discover">({ action: "discover", ...request }, options);
}

export async function browsePlaces(
  search: BrowseSpec,
  languageCode: PlaceLanguage,
  options: RequestOptions = {},
): Promise<BrowseResponse> {
  return invoke<"browse">({ action: "browse", languageCode, search }, options);
}

export async function getPlaceContent(
  placeId: string,
  languageCode: PlaceLanguage,
  options: RequestOptions = {},
): Promise<PlaceContent> {
  const result = await invoke<"content">({
    action: "content",
    placeId,
    languageCode,
  }, options);
  if (result.content.place.placeId !== placeId) {
    throw new PlacesError("INVALID_RESPONSE", true);
  }
  return result.content;
}

export async function getPlacePhoto(
  placeId: string,
  size: "card" | "hero",
  languageCode: PlaceLanguage,
  options: RequestOptions = {},
): Promise<GooglePlacePhoto | null> {
  const result = await invoke<"photo">({
    action: "photo",
    placeId,
    size,
    languageCode,
  }, options);
  if (result.photo && result.photo.placeId !== placeId) {
    throw new PlacesError("INVALID_RESPONSE", true);
  }
  return result.photo;
}
