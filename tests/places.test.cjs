/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
// Ejecuta el código de la aplicación, sin red ni credenciales reales.
function load(relative, imports = {}) {
  const file = path.join(root, relative);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const resolve = (name) => {
    if (name in imports) return imports[name];
    if (name.startsWith('.')) {
      const canonical = path
        .relative(path.join(root, 'src'), path.resolve(path.dirname(file), name))
        .split(path.sep)
        .join('/');
      const alias = '@/' + canonical;
      if (alias in imports) return imports[alias];
    }
    throw Error('Import sin mock: ' + name);
  };
  new Function('require', 'module', 'exports', 'Deno', js)(resolve, module, module.exports, {
    serve: () => {},
    env: {
      get: (name) =>
        ({
          SUPABASE_URL: 'https://example.test',
          SUPABASE_ANON_KEY: 'test-anon',
          SUPABASE_SERVICE_ROLE_KEY: 'test-service',
          GOOGLE_PLACES_API_KEY: 'test-google',
        })[name],
    },
  });
  return module.exports;
}

const place = (id = 'granada') => ({
  placeId: id,
  name: 'Granada',
  address: 'España',
  location: { lat: 37.17, lng: -3.6 },
  viewport: null,
  countryCode: 'ES',
  countryName: 'España',
  types: ['locality'],
  googleMapsUri: null,
  attributions: [],
});
class HttpError extends Error {
  constructor(context) {
    super('http');
    this.context = context;
  }
}
const client = (invoke) =>
  load('src/services/places.ts', {
    '@supabase/supabase-js': { FunctionsHttpError: HttpError },
    '@/services/supabase': { supabase: { functions: { invoke } } },
  });
const tick = () => new Promise((resolve) => setImmediate(resolve));
test('Details conserva el ID y admite coordenadas cero', async () => {
  const value = { ...place(), location: { lat: 0, lng: 0 } };
  const api = client(async (name, options) => {
    assert.equal(name, 'places');
    assert.equal(options.body.languageCode, 'es');
    return { data: { data: { place: value } }, error: null };
  });
  assert.deepEqual(await api.getPlaceDetails('granada', { languageCode: 'es' }), value);
});
test('Un 200 incompleto produce INVALID_RESPONSE', async () => {
  const api = client(async () => ({ data: { data: { place: { name: 'incompleto' } } } }));
  await assert.rejects(api.getPlaceDetails('x', { languageCode: 'es' }), {
    code: 'INVALID_RESPONSE',
  });
});
for (const [status, payload, code] of [
  [401, {}, 'UNAUTHENTICATED'],
  [429, { error: { code: 'RATE_LIMITED', retryable: true } }, 'RATE_LIMITED'],
  [503, { error: { code: 'REFERENCE_SAVE_FAILED', retryable: true } }, 'REFERENCE_SAVE_FAILED'],
]) {
  test(`HTTP ${status} conserva un error recuperable explícito`, async () => {
    const api = client(async () => ({
      error: new HttpError(new Response(JSON.stringify(payload), { status })),
    }));
    await assert.rejects(api.getPlaceDetails('x', { languageCode: 'es' }), { code, status });
  });
}
test('Una petición ya cancelada no invoca la función', async () => {
  let calls = 0;
  const api = client(async () => {
    calls++;
  });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    api.getPlaceDetails('x', { languageCode: 'es', signal: controller.signal }),
    { code: 'CANCELLED' },
  );
  assert.equal(calls, 0);
});
function session(getPlaceDetails) {
  const api = client(async () => {
    throw Error('No se usa');
  });
  return load('src/services/place-session.ts', {
    '@/services/places': { getPlaceDetails, PlacesError: api.PlacesError },
  });
}
test('El mismo ID/idioma comparte petición y cambia de resultado al cambiar idioma', async () => {
  let calls = 0;
  const memory = session(async (id) => {
    calls++;
    await tick();
    return place(id);
  });
  memory.setPlaceOwner('A');
  const first = memory.resolvePlace('x', 'es'),
    second = memory.resolvePlace('x', 'es');
  assert.equal(first, second);
  await Promise.all([first, second]);
  await memory.resolvePlace('x', 'es');
  assert.equal(calls, 1);
  await memory.resolvePlace('x', 'en');
  assert.equal(calls, 2);
});
test('La cola limita Details a tres peticiones simultáneas', async () => {
  let active = 0,
    maximum = 0;
  const memory = session(async (id) => {
    active++;
    maximum = Math.max(active, maximum);
    await tick();
    active--;
    return place(id);
  });
  memory.setPlaceOwner('A');
  await Promise.all(Array.from({ length: 9 }, (_, i) => memory.resolvePlace(String(i), 'es')));
  assert.equal(maximum, 3);
});
test('Cambiar de cuenta invalida respuesta pendiente y memoria anterior', async () => {
  let finish;
  const memory = session(
    (id) =>
      new Promise((resolve) => {
        finish = () => resolve(place(id));
      }),
  );
  memory.setPlaceOwner('A');
  const pending = memory.resolvePlace('x', 'es');
  const rejected = assert.rejects(pending, { code: 'CANCELLED' });
  memory.setPlaceOwner('B');
  finish();
  await rejected;
  assert.equal(memory.readPlace('x', 'es'), undefined);
});
test('Ir al fondo limpia datos y suspende Details hasta volver', async () => {
  const memory = session(async (id) => place(id));
  memory.setPlaceOwner('A');
  await memory.resolvePlace('x', 'es');
  memory.setPlaceForeground(false);
  assert.equal(memory.readPlace('x', 'es'), undefined);
  await assert.rejects(memory.resolvePlace('x', 'es'), { code: 'CANCELLED' });
  memory.setPlaceForeground(true);
  assert.equal((await memory.resolvePlace('x', 'es')).placeId, 'x');
});
const geometry = load('src/utils/mapRegion.ts');
test('No hay Madrid ni región inventada cuando faltan todos los puntos', () => {
  assert.equal(geometry.itineraryRegion([], null), null);
  assert.equal(geometry.isValidCoordinate({ lat: 91, lng: 0 }), false);
  assert.equal(geometry.isValidCoordinate({ lat: 0, lng: 0 }), true);
});
test('Los puntos de actividades tienen prioridad sobre el destino', () => {
  const region = geometry.itineraryRegion(
    [
      { lat: 10, lng: 20 },
      { lat: 12, lng: 24 },
    ],
    place(),
  );
  assert.equal(region.latitude, 11);
  assert.equal(region.longitude, 22);
  assert.ok(region.longitudeDelta > 4);
});
test('Viewport y actividades próximos a Fiji cruzan el antimeridiano por el arco corto', () => {
  const viewport = geometry.regionFromViewport({
    low: { lat: -18, lng: 179 },
    high: { lat: -16, lng: -179 },
  });
  const points = geometry.regionForPoints([
    { lat: -18, lng: 179 },
    { lat: -16, lng: -179 },
  ]);
  for (const region of [viewport, points]) {
    assert.equal(Math.abs(region.longitude), 180);
    assert.ok(region.longitudeDelta < 3);
  }
});
test('Update parcial conserva la referencia; null la desvincula explícitamente', async () => {
  const patches = [];
  const supabase = {
    from: () => ({
      update: (patch) => {
        patches.push(patch);
        return {
          eq: () => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: 'trip',
                  destination: 'Personal',
                  destination_place_id: patch.destination_place_id ?? 'x',
                },
                error: null,
              }),
            }),
          }),
        };
      },
    }),
  };
  const service = load('src/services/trips.ts', { '@/services/supabase': { supabase } });
  await service.updateTrip('trip', { title: 'Otro título' });
  await service.updateTrip('trip', { destinationPlaceId: null });
  assert.equal(Object.hasOwn(patches[0], 'destination_place_id'), false);
  assert.equal(patches[1].destination_place_id, null);
});
function stats(trips, resolve = async (id) => place(id), activities = []) {
  return load('src/utils/stats.ts', {
    '@/services/trips': { listTrips: async () => trips },
    '@/services/activities': { listActivitiesByTrip: async () => activities },
    '@/constants/countryCodes': load('src/constants/countryCodes.ts', {}, true),
    '@/utils/mapRegion': geometry,
    '@/services/place-session': {
      placeSessionVersion: () => 0,
      readPlace: () => undefined,
      resolvePlace: resolve,
    },
  });
}
test('Madrid y Barcelona manuales no se cuentan como países distintos', async () => {
  const value = await stats(
    ['Madrid', 'Barcelona'].map((destination) => ({
      status: 'completed',
      destination,
      destinationPlaceId: null,
    })),
  ).getUserStats('A');
  assert.equal(value.countriesCount, 0);
  assert.equal(value.unresolvedDestinationsCount, 2);
});
test('Dos referencias españolas cuentan un único país', async () => {
  const value = await stats(
    ['Madrid', 'Barcelona'].map((destinationPlaceId) => ({
      status: 'completed',
      destinationPlaceId,
    })),
  ).getUserStats('A');
  assert.equal(value.countriesCount, 1);
  assert.deepEqual(value.countryCodes, ['ES']);
});
test('Los fallos de resolución producen estadísticas parciales', async () => {
  const value = await stats([{ status: 'completed', destinationPlaceId: 'x' }], async () => {
    throw Error('offline');
  }).getUserStats('A');
  assert.equal(value.unresolvedDestinationsCount, 1);
  assert.equal(value.resolutionFailures, 1);
});
test('Los kilómetros incluyen actividades que guardaron solo un Place ID', async () => {
  const value = await stats(
    [{ id: 'trip', status: 'completed', destination: 'España', destinationPlaceId: null }],
    async (id) => place(id),
    [{ placeId: 'poi', location: null }],
  ).getUserStats('A', { lat: 0, lng: 0 });
  assert.ok(value.kilometers > 0);
  assert.equal(value.kilometersPartial, false);
});

const google = load('supabase/functions/places/google.ts');
function edge({ allowed = true, limitError = null, saveError = null } = {}) {
  const calls = [];
  const api = load('supabase/functions/places/index.ts', {
    '@supabase/supabase-js': {
      createClient: (_url, key) =>
        key === 'test-anon'
          ? { auth: { getUser: async () => ({ data: { user: { id: 'user-A' } }, error: null }) } }
          : {
              rpc: async (name, args) => {
                calls.push({ name, args });
                return { data: allowed, error: limitError };
              },
              from: (table) => ({
                upsert: async (row) => {
                  calls.push({ table, row });
                  return { error: saveError };
                },
              }),
            },
    },
    './google.ts': {
      ...google,
      googleDetails: async () => {
        calls.push({ google: true });
        return { place: place('resolved-id') };
      },
    },
  });
  return { ...api, calls };
}
const detailsRequest = (authorized = true) =>
  new Request('https://example.test/places', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authorized ? { Authorization: 'Bearer test-token' } : {}),
    },
    body: JSON.stringify({ action: 'details', placeId: 'resolved-id', languageCode: 'es' }),
  });

test('El backend rechaza acciones, idiomas, tokens y coordenadas inválidos', () => {
  const { parsePlacesRequest } = edge();
  const invalid = [
    { action: 'delete', languageCode: 'es' },
    { action: 'details', languageCode: 'fr', placeId: 'x' },
    { action: 'details', languageCode: 'es', placeId: ' ' },
    {
      action: 'autocomplete',
      languageCode: 'es',
      scope: 'destinations',
      input: 'Madrid',
      sessionToken: 'invalid',
    },
    { action: 'nearby', languageCode: 'es', category: 'museum', center: { lat: 91, lng: 0 } },
    { action: 'nearby', languageCode: 'es', category: 'museum', center: { lat: 0, lng: NaN } },
  ];
  for (const input of invalid)
    assert.throws(() => parsePlacesRequest(input), { code: 'INVALID_INPUT' });
});

test('El backend acepta coordenadas cero y conserva el token de paginación', () => {
  const { parsePlacesRequest } = edge();
  const input = {
    action: 'textSearch',
    languageCode: 'en',
    query: 'parks',
    center: { lat: 0, lng: 0 },
    pageToken: 'page-2',
  };
  assert.deepEqual(parsePlacesRequest(input), input);
});

test('Sin autorización no se consulta Google ni se escribe en la base de datos', async () => {
  const api = edge();
  const response = await api.handler(detailsRequest(false));
  assert.equal(response.status, 401);
  assert.deepEqual(api.calls, []);
});

test('Superar la cuota devuelve 429 antes de consultar Google', async () => {
  const api = edge({ allowed: false });
  const response = await api.handler(detailsRequest());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '60');
  assert.deepEqual(api.calls, [
    { name: 'consume_places_request', args: { p_user_id: 'user-A', p_action: 'details' } },
  ]);
});

test('Details guarda únicamente la referencia, no los datos de Google', async () => {
  const api = edge();
  const response = await api.handler(detailsRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(api.calls.at(-1), {
    table: 'place_references',
    row: { google_place_id: 'resolved-id' },
  });
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal((await response.json()).data.place.placeId, 'resolved-id');
});

test('Un fallo al registrar la referencia no presenta Details como un éxito', async () => {
  const api = edge({ saveError: { message: 'unavailable' } });
  const response = await api.handler(detailsRequest());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, 'REFERENCE_SAVE_FAILED');
});

test('El adaptador conserva países y viewports que cruzan el antimeridiano', () => {
  const result = google.mapGoogleDetails({
    id: 'fiji',
    displayName: { text: 'Fiji' },
    types: ['country'],
    location: { latitude: -17, longitude: 180 },
    viewport: { low: { latitude: -18, longitude: 179 }, high: { latitude: -16, longitude: -179 } },
    addressComponents: [{ types: ['country'], shortText: 'fj', longText: 'Fiji' }],
  });
  assert.equal(result.countryCode, 'FJ');
  assert.equal(result.viewport.high.lng, -179);
});
