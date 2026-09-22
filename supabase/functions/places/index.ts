import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../src/types/database.ts';
import type { ExploreArea, BrowseSpec } from '../../../src/types/explore.ts';
import type { LatLng, PlacesErrorBody, PlacesRequest } from '../../../src/types/place.ts';
import { discoverPlacesOnServer } from './discovery.ts';
import {
  PlacesHttpError,
  googleAutocomplete,
  googleBrowseNearby,
  googleBrowseText,
  googleContent,
  googleDetails,
  googleNearby,
  googlePhoto,
  googleTextSearch,
} from './google.ts';

function invalidInput(): never {
  throw new PlacesHttpError(400, 'INVALID_INPUT', false);
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalidInput();
  return value as Record<string, unknown>;
}

function string(value: unknown, max: number, allowEmpty = false): string {
  if (typeof value !== 'string' || value.length > max) return invalidInput();
  const clean = value.trim();
  if (!allowEmpty && !clean) return invalidInput();
  return clean;
}

function placeId(value: unknown): string {
  const id = string(value, 1_024);
  if (/^https?:\/\//i.test(id)) return invalidInput();
  return id;
}

function token(value: unknown): string {
  const clean = string(value, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean))
    return invalidInput();
  return clean;
}

function center(value: unknown): LatLng {
  const point = record(value);
  const lat = point.lat;
  const lng = point.lng;
  if (typeof lat !== 'number' || !Number.isFinite(lat) || Math.abs(lat) > 90)
    return invalidInput();
  if (typeof lng !== 'number' || !Number.isFinite(lng) || Math.abs(lng) > 180)
    return invalidInput();
  return { lat, lng };
}

function countryCode(value: unknown): string {
  const code = string(value, 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return invalidInput();
  const name = new Intl.DisplayNames(['en'], { type: 'region' }).of(code);
  if (!name || name === code || name.toLowerCase().includes('unknown region')) return invalidInput();
  return code;
}

function timeZone(value: unknown): string {
  const zone = string(value, 100);
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone }).format();
    return zone;
  } catch {
    return invalidInput();
  }
}

function interestCategory(value: unknown) {
  if (value !== 'visit' && value !== 'museum' && value !== 'park' && value !== 'restaurant')
    return invalidInput();
  return value;
}

function exploreArea(value: unknown): ExploreArea {
  const area = record(value);
  if (area.kind === 'country') {
    return { kind: 'country', countryCode: countryCode(area.countryCode) };
  }
  if (area.kind === 'place') {
    return { kind: 'place', placeId: placeId(area.placeId) };
  }
  return invalidInput();
}

function browseSpec(value: unknown): BrowseSpec {
  const search = record(value);
  if (search.kind === 'text') {
    if (search.mode !== 'cities' && search.mode !== 'places') return invalidInput();
    const query = string(search.query, 200);
    if (query.length < 3) return invalidInput();
    return {
      kind: 'text',
      mode: search.mode,
      query,
      ...(search.center === undefined ? {} : { center: center(search.center) }),
      ...(search.pageToken === undefined
        ? {}
        : { pageToken: string(search.pageToken, 4_096) }),
    };
  }
  if (search.kind === 'nearby') {
    return {
      kind: 'nearby',
      center: center(search.center),
      category: interestCategory(search.category),
    };
  }
  return invalidInput();
}

export function parsePlacesRequest(value: unknown): PlacesRequest {
  const body = record(value);
  const languageCode = body.languageCode;
  if (languageCode !== 'es' && languageCode !== 'en') return invalidInput();

  switch (body.action) {
    case 'autocomplete': {
      if (body.scope !== 'destinations' && body.scope !== 'activities') return invalidInput();
      return {
        action: 'autocomplete',
        languageCode,
        input: string(body.input, 200, true),
        scope: body.scope,
        sessionToken: token(body.sessionToken),
        ...(body.center === undefined ? {} : { center: center(body.center) }),
      };
    }
    case 'details':
      return {
        action: 'details',
        languageCode,
        placeId: placeId(body.placeId),
        ...(body.sessionToken === undefined ? {} : { sessionToken: token(body.sessionToken) }),
      };
    case 'nearby':
      return {
        action: 'nearby',
        languageCode,
        category: interestCategory(body.category),
        center: center(body.center),
      };
    case 'textSearch':
      return {
        action: 'textSearch',
        languageCode,
        query: string(body.query, 200),
        ...(body.center === undefined ? {} : { center: center(body.center) }),
        ...(body.pageToken === undefined ? {} : { pageToken: string(body.pageToken, 4_096) }),
      };
    case 'discover': {
      if (body.mode !== 'cities' && body.mode !== 'places') return invalidInput();
      return {
        action: 'discover',
        languageCode,
        mode: body.mode,
        ...(body.area === undefined ? {} : { area: exploreArea(body.area) }),
        ...(body.fallbackCountryCode === undefined
          ? {}
          : { fallbackCountryCode: countryCode(body.fallbackCountryCode) }),
        ...(body.timeZone === undefined ? {} : { timeZone: timeZone(body.timeZone) }),
      };
    }
    case 'browse':
      return { action: 'browse', languageCode, search: browseSpec(body.search) };
    case 'content':
      return {
        action: 'content',
        languageCode,
        placeId: placeId(body.placeId),
      };
    case 'photo':
      if (body.size !== 'card' && body.size !== 'hero') return invalidInput();
      return {
        action: 'photo',
        languageCode,
        placeId: placeId(body.placeId),
        size: body.size,
      };
    default:
      return invalidInput();
  }
}

async function readJson(req: Request): Promise<unknown> {
  const contentType = req.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json' || !req.body) return invalidInput();
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16_384) {
        await reader.cancel();
        throw new PlacesHttpError(413, 'INVALID_INPUT', false);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (error) {
    if (error instanceof PlacesHttpError) throw error;
    return invalidInput();
  } finally {
    reader.releaseLock();
  }
}

function env(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    console.error(JSON.stringify({ event: 'places_missing_environment', variable: name }));
    throw new PlacesHttpError(503, 'UPSTREAM_UNAVAILABLE', false);
  }
  return value;
}

const authOptions = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
};

export async function handler(req: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Expose-Headers': 'x-request-id, retry-after',
    'X-Request-Id': requestId,
  });
  const json = (value: unknown, status = 200) =>
    new Response(JSON.stringify(value), { status, headers });

  try {
    const origin = req.headers.get('origin');
    const allowedOrigins = (Deno.env.get('PLACES_ALLOWED_ORIGINS') ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (origin) {
      if (!allowedOrigins.includes(origin)) throw new PlacesHttpError(403, 'INVALID_INPUT', false);
      headers.set('Access-Control-Allow-Origin', origin);
    }
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (req.method !== 'POST') {
      headers.set('Allow', 'POST, OPTIONS');
      throw new PlacesHttpError(405, 'INVALID_INPUT', false);
    }

    const authorization = req.headers.get('authorization');
    const bearer = authorization?.match(/^Bearer\s+(\S+)$/i);
    if (!bearer) throw new PlacesHttpError(401, 'UNAUTHENTICATED', false);

    const supabaseUrl = env('SUPABASE_URL');
    const userClient = createClient<Database>(supabaseUrl, env('SUPABASE_ANON_KEY'), {
      auth: authOptions,
      global: { headers: { Authorization: `Bearer ${bearer[1]}` } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser(bearer[1]);
    if (authError) {
      const status = authError.status;
      if (!status || status === 429 || status >= 500)
        throw new PlacesHttpError(503, 'UPSTREAM_UNAVAILABLE', true);
      throw new PlacesHttpError(401, 'UNAUTHENTICATED', false);
    }
    if (!user) throw new PlacesHttpError(401, 'UNAUTHENTICATED', false);

    const request = parsePlacesRequest(await readJson(req));
    if (request.action === 'autocomplete' && request.input.length < 3) {
      return json({ data: { suggestions: [] } });
    }

    const admin = createClient<Database>(supabaseUrl, env('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: authOptions,
    });
    const consume = async (action: PlacesRequest['action']) => {
      const { data: allowed, error } = await admin.rpc('consume_places_request', {
        p_user_id: user.id,
        p_action: action,
      });
      if (error || typeof allowed !== 'boolean') {
        console.error(JSON.stringify({ event: 'places_limit_failed', requestId }));
        throw new PlacesHttpError(503, 'UPSTREAM_UNAVAILABLE', true);
      }
      if (!allowed) {
        headers.set('Retry-After', '60');
        throw new PlacesHttpError(429, 'RATE_LIMITED', true);
      }
    };

    await consume(request.action);
    const apiKey = env('GOOGLE_PLACES_API_KEY');
    const signal = request.action === 'discover'
      ? AbortSignal.any([req.signal, AbortSignal.timeout(15_000)])
      : req.signal;

    switch (request.action) {
      case 'autocomplete':
        return json({ data: await googleAutocomplete(request, apiKey, signal) });
      case 'nearby':
        return json({ data: await googleNearby(request, apiKey, signal) });
      case 'textSearch':
        return json({ data: await googleTextSearch(request, apiKey, signal) });
      case 'details': {
        const data = await googleDetails(request, apiKey, signal);
        const { error } = await admin.from('place_references').upsert(
          { google_place_id: data.place.placeId },
          { onConflict: 'google_place_id', ignoreDuplicates: true },
        );
        if (error) {
          console.error(JSON.stringify({ event: 'places_reference_failed', requestId }));
          throw new PlacesHttpError(503, 'REFERENCE_SAVE_FAILED', true);
        }
        return json({ data });
      }
      case 'browse': {
        if (request.search.kind === 'text') {
          await consume('textSearch');
          return json({
            data: await googleBrowseText(
              request.search, request.languageCode, apiKey, signal,
            ),
          });
        }
        await consume('nearby');
        return json({
          data: await googleBrowseNearby(
            request.search.center,
            request.search.category,
            request.languageCode,
            apiKey,
            signal,
          ),
        });
      }
      case 'content': {
        await consume('details');
        const content = await googleContent(
          request.placeId, request.languageCode, apiKey, signal,
        );
        const { error } = await admin.from('place_references').upsert(
          { google_place_id: content.place.placeId },
          { onConflict: 'google_place_id', ignoreDuplicates: true },
        );
        if (error) {
          console.error(JSON.stringify({ event: 'places_reference_failed', requestId }));
          throw new PlacesHttpError(503, 'REFERENCE_SAVE_FAILED', true);
        }
        return json({ data: { content } });
      }
      case 'photo': {
        await consume('details');
        return json({
          data: {
            photo: await googlePhoto(request.placeId, request.size, apiKey, signal),
          },
        });
      }
      case 'discover': {
        const configured = (Deno.env.get('EXPLORE_DEFAULT_COUNTRY') ?? 'ES').trim();
        const defaultCountryCode = countryCode(configured);
        const data = await discoverPlacesOnServer({
          userClient,
          userId: user.id,
          apiKey,
          request,
          defaultCountryCode,
          signal,
          consume: (action) => consume(action),
        });
        return json({ data });
      }
    }
  } catch (error) {
    const known = error instanceof PlacesHttpError;
    if (!known) console.error(JSON.stringify({ event: 'places_unexpected_error', requestId }));
    const failure = known ? error : new PlacesHttpError(500, 'UPSTREAM_UNAVAILABLE', true);
    const body: PlacesErrorBody = {
      error: { code: failure.code, retryable: failure.retryable },
    };
    return json(body, failure.status);
  }
}

Deno.serve(handler);
