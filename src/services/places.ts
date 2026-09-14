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
    const p = value.place;
    return (
      obj(p) &&
      summary(p) &&
      nullableText(p.countryCode) &&
      nullableText(p.countryName) &&
      nullableText(p.googleMapsUri) &&
      (p.viewport === null ||
        (obj(p.viewport) && point(p.viewport.low) && point(p.viewport.high)))
    );
  }

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
        throw new PlacesError(
          payload.error.code as PlacesErrorCode,
          payload.error.retryable === true,
          response.status,
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
