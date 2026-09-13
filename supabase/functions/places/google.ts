import type {
  InterestCategory,
  LatLng,
  PlaceDetails,
  PlaceSummary,
  PlaceSuggestion,
  PlacesDataByAction,
  PlacesErrorCode,
  PlacesRequest,
} from '../../../src/types/place.ts';

export class PlacesHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: PlacesErrorCode,
    public readonly retryable: boolean,
  ) {
    super(code);
    this.name = 'PlacesHttpError';
  }
}

type ObjectValue = Record<string, unknown>;
type RequestOf<A extends PlacesRequest['action']> =
  Extract<PlacesRequest, { action: A }>;

const BASE = 'https://places.googleapis.com/v1';

const DETAILS_MASK = [
  'id', 'displayName', 'formattedAddress', 'location', 'viewport',
  'addressComponents', 'types', 'googleMapsUri', 'attributions',
].join(',');

const SEARCH_MASK = [
  'places.id', 'places.displayName', 'places.formattedAddress',
  'places.location', 'places.types', 'places.attributions',
].join(',');

const AUTOCOMPLETE_MASK = [
  'suggestions.placePrediction.placeId',
  'suggestions.placePrediction.text.text',
  'suggestions.placePrediction.structuredFormat.mainText.text',
  'suggestions.placePrediction.structuredFormat.secondaryText.text',
].join(',');

const CATEGORY_TYPES: Record<InterestCategory, string[]> = {
  visit: ['tourist_attraction'],
  museum: ['museum'],
  park: ['park'],
  restaurant: ['restaurant'],
};

function object(value: unknown): ObjectValue | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as ObjectValue
    : undefined;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function invalidResponse(): never {
  throw new PlacesHttpError(502, 'UPSTREAM_UNAVAILABLE', true);
}

function array(value: unknown): unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return invalidResponse();
  return value;
}

function coordinates(value: unknown): LatLng | null {
  const point = object(value);
  if (!point) return null;

  const lat = point.latitude;
  const lng = point.longitude;

  if (typeof lat !== 'number' || !Number.isFinite(lat) || Math.abs(lat) > 90)
    return null;
  if (typeof lng !== 'number' || !Number.isFinite(lng) || Math.abs(lng) > 180)
    return null;
  return { lat, lng };
}

function attributions(value: unknown): PlaceDetails['attributions'] {
  return array(value).map((item) => {
    const attribution = object(item);
    const provider = text(attribution?.provider);
    if (!provider) return invalidResponse();
    return { provider, providerUri: text(attribution?.providerUri) };
  });
}

function summary(value: unknown): PlaceSummary {
  const place = object(value);
  if (!place) return invalidResponse();
  const placeId = text(place.id);
  const name = text(object(place.displayName)?.text);
  if (!placeId || !name) return invalidResponse();
  const types = array(place.types);
  if (!types.every((type): type is string => typeof type === 'string'))
    return invalidResponse();
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
  const country = array(place.addressComponents)
    .map(object)
    .find((part) => Array.isArray(part?.types) && part.types.includes('country'));
  const code = text(country?.shortText)?.toUpperCase();
  return {
    ...base,
    // La longitud puede cruzar el antimeridiano: no exigimos low.lng <= high.lng.
    viewport: low && high && low.lat <= high.lat ? { low, high } : null,
    countryCode: code && /^[A-Z]{2}$/.test(code) ? code : null,
    countryName: text(country?.longText),
    googleMapsUri: text(place.googleMapsUri),
  };
}

function circle(center: LatLng, radius: number) {
  return {
    circle: {
      center: { latitude: center.lat, longitude: center.lng },
      radius,
    },
  };
}

async function fetchGoogle(
  url: string,
  apiKey: string,
  fieldMask: string,
  body?: ObjectValue,
): Promise<ObjectValue> {
  const signal = AbortSignal.timeout(8_000);
  try {
    const response = await fetch(url, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
    if (!response.ok) {
      // No imprimir la URL, consultas, claves ni el cuerpo del proveedor.
      console.error(JSON.stringify({ event: 'places_google_http_error', status: response.status }));
      if (response.status === 404)
        throw new PlacesHttpError(404, 'NOT_FOUND', false);
      if (response.status === 400)
        throw new PlacesHttpError(400, 'INVALID_INPUT', false);
      throw new PlacesHttpError(
        503, 'UPSTREAM_UNAVAILABLE',
        response.status === 429 || response.status >= 500,
      );
    }
    const result = object(await response.json());
    if (!result) return invalidResponse();
    return result;
  } catch (error) {
    if (error instanceof PlacesHttpError) throw error;
    if (signal.aborted) throw new PlacesHttpError(504, 'TIMEOUT', true);
    throw new PlacesHttpError(502, 'UPSTREAM_UNAVAILABLE', true);
  }
}

export async function googleAutocomplete(
  request: RequestOf<'autocomplete'>,
  apiKey: string,
): Promise<PlacesDataByAction['autocomplete']> {
  const body: ObjectValue = {
    input: request.input,
    languageCode: request.languageCode,
    sessionToken: request.sessionToken,
    includeQueryPredictions: false,
  };
  if (request.scope === 'destinations') {
    body.includedPrimaryTypes = ['locality', 'administrative_area_level_1', 'country'];
  }
  if (request.center) body.locationBias = circle(request.center, 30_000);
  const result = await fetchGoogle(`${BASE}/places:autocomplete`, apiKey, AUTOCOMPLETE_MASK, body);
  const suggestions: PlaceSuggestion[] = array(result.suggestions).map((item) => {
    const prediction = object(object(item)?.placePrediction);
    const structured = object(prediction?.structuredFormat);
    const placeId = text(prediction?.placeId);
    const mainText = text(object(structured?.mainText)?.text)
      ?? text(object(prediction?.text)?.text);
    if (!placeId || !mainText) return invalidResponse();
    return {
      placeId,
      mainText,
      secondaryText: text(object(structured?.secondaryText)?.text) ?? '',
    };
  });
  return { suggestions };
}

export async function googleDetails(
  request: RequestOf<'details'>,
  apiKey: string,
): Promise<PlacesDataByAction['details']> {
  const url = new URL(`${BASE}/places/${encodeURIComponent(request.placeId)}`);
  url.searchParams.set('languageCode', request.languageCode);
  if (request.sessionToken) url.searchParams.set('sessionToken', request.sessionToken);
  const result = await fetchGoogle(url.toString(), apiKey, DETAILS_MASK);
  return { place: mapGoogleDetails(result) };
}

export async function googleNearby(
  request: RequestOf<'nearby'>,
  apiKey: string,
): Promise<PlacesDataByAction['nearby']> {
  const result = await fetchGoogle(`${BASE}/places:searchNearby`, apiKey, SEARCH_MASK, {
    includedTypes: CATEGORY_TYPES[request.category],
    languageCode: request.languageCode,
    maxResultCount: 10,
    rankPreference: 'POPULARITY',
    locationRestriction: circle(request.center, 5_000),
  });
  return { places: array(result.places).map(summary) };
}

export async function googleTextSearch(
  request: RequestOf<'textSearch'>,
  apiKey: string,
): Promise<PlacesDataByAction['textSearch']> {
  const body: ObjectValue = {
    textQuery: request.query,
    languageCode: request.languageCode,
    pageSize: 10,
  };
  if (request.center) body.locationBias = circle(request.center, 30_000);
  if (request.pageToken) body.pageToken = request.pageToken;
  const result = await fetchGoogle(
    `${BASE}/places:searchText`, apiKey, `${SEARCH_MASK},nextPageToken`, body,
  );
  return {
    places: array(result.places).map(summary),
    nextPageToken: text(result.nextPageToken),
  };
}