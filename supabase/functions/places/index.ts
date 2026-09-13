import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../src/types/database.ts';
import type {
  LatLng,
  PlacesErrorBody,
  PlacesRequest,
} from '../../../src/types/place.ts';
import {
  PlacesHttpError,
  googleAutocomplete,
  googleDetails,
  googleNearby,
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

function token(value: unknown): string {
  const clean = string(value, 36);
  // UUID v4: es el formato que usará el generador de sesiones de la app.
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
        placeId: string(body.placeId, 1_024),
        ...(body.sessionToken === undefined ? {} : { sessionToken: token(body.sessionToken) }),
      };
    case 'nearby': {
      const category = body.category;
      if (category !== 'visit' && category !== 'museum' && category !== 'park' && category !== 'restaurant')
        return invalidInput();
      return { action: 'nearby', languageCode, category, center: center(body.center) };
    }
    case 'textSearch':
      return {
        action: 'textSearch',
        languageCode,
        query: string(body.query, 200),
        ...(body.center === undefined ? {} : { center: center(body.center) }),
        ...(body.pageToken === undefined ? {} : { pageToken: string(body.pageToken, 4_096) }),
      };
    default:
      return invalidInput();
  }
}

// Limita los bytes realmente leídos, aunque no venga Content-Length.
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
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Expose-Headers': 'x-request-id, retry-after',
    'X-Request-Id': requestId,
  });
  const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers });

  try {
    const origin = req.headers.get('origin');
    const allowedOrigins = (Deno.env.get('PLACES_ALLOWED_ORIGINS') ?? '')
      .split(',').map((value) => value.trim()).filter(Boolean);
    if (origin) {
      if (!allowedOrigins.includes(origin))
        throw new PlacesHttpError(403, 'INVALID_INPUT', false);
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
    // Sin consulta a Google ni escritura de contadores para entradas cortas.
    if (request.action === 'autocomplete' && request.input.length < 3)
      return json({ data: { suggestions: [] } });

    // Cliente distinto, sin la cabecera Authorization del usuario.
    const admin = createClient<Database>(supabaseUrl, env('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: authOptions,
    });
    const { data: allowed, error: limitError } = await admin.rpc('consume_places_request', {
      p_user_id: user.id,
      p_action: request.action,
    });
    if (limitError || typeof allowed !== 'boolean') {
      console.error(JSON.stringify({ event: 'places_limit_failed', requestId }));
      throw new PlacesHttpError(503, 'UPSTREAM_UNAVAILABLE', true);
    }
    if (!allowed) {
      headers.set('Retry-After', '60');
      throw new PlacesHttpError(429, 'RATE_LIMITED', true);
    }

    const apiKey = env('GOOGLE_PLACES_API_KEY');
    switch (request.action) {
      case 'autocomplete':
        return json({ data: await googleAutocomplete(request, apiKey) });
      case 'nearby':
        return json({ data: await googleNearby(request, apiKey) });
      case 'textSearch':
        return json({ data: await googleTextSearch(request, apiKey) });
      case 'details': {
        const data = await googleDetails(request, apiKey);
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

// Registra el handler HTTP cuando Supabase inicia esta función.
Deno.serve(handler);