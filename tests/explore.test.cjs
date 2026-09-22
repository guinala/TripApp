/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const compile = (source) =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;

function loader(mocks = {}) {
  const cache = new Map();
  function load(relative) {
    if (cache.has(relative)) return cache.get(relative).exports;
    const module = { exports: {} };
    cache.set(relative, module);
    const file = path.join(root, relative);
    const requireLocal = (name) => {
      if (name in mocks) return mocks[name];
      let local = name.startsWith('@/')
        ? `src/${name.slice(2)}`
        : name.startsWith('.')
          ? path.relative(root, path.resolve(path.dirname(file), name)).split(path.sep).join('/')
          : null;
      if (!local) return require(name);
      if (!/\.(tsx?|json)$/.test(local)) local += '.ts';
      return load(local);
    };
    vm.runInNewContext(
      compile(fs.readFileSync(file, 'utf8')),
      {
        module,
        exports: module.exports,
        require: requireLocal,
        console,
        URL,
        URLSearchParams,
        AbortController,
        fetch: mocks.__fetch ?? fetch,
        process,
        setTimeout,
        clearTimeout,
      },
      { filename: relative },
    );
    return module.exports;
  }
  return load;
}

const makePlace = (id, overrides = {}) => ({
  placeId: id,
  name: id,
  address: null,
  location: { lat: 40, lng: -3 },
  types: ['tourist_attraction'],
  attributions: [],
  rating: 4,
  ratingCount: 100,
  priceLevel: null,
  countryCode: 'ES',
  countryName: 'España',
  localityName: 'Madrid',
  primaryType: 'tourist_attraction',
  ...overrides,
});

function placesClient(invoke) {
  class FunctionsHttpError extends Error {}
  return loader({
    '@supabase/supabase-js': { FunctionsHttpError },
    '@/services/supabase': { supabase: { functions: { invoke } } },
    './supabase': { supabase: { functions: { invoke } } },
  })('src/services/places.ts');
}

test('los formateadores distinguen ausencia, cero y descripción vacía', () => {
  const presentation = loader()('src/utils/place-presentation.ts');
  assert.equal(presentation.formatPlaceRating(null, 'es'), '-');
  assert.equal(presentation.formatPlaceRating(0, 'en'), '0.0');
  assert.equal(presentation.descriptionText(null, 'Descripción no disponible'), 'Descripción no disponible');
  assert.equal(
    presentation.descriptionText({ text: '   ' }, 'Descripción no disponible'),
    'Descripción no disponible',
  );
  assert.equal(presentation.priceTranslationKey('free'), 'dynamicExplore.price.free');
});

test('la nota ajustada no premia automáticamente cinco estrellas con dos opiniones', () => {
  const ranking = loader()('src/utils/explore-ranking.ts');
  const ordered = ranking.rankExplorePlaces(
    [
      makePlace('pocas', { rating: 5, ratingCount: 2 }),
      makePlace('muchas', { rating: 4.7, ratingCount: 1000 }),
    ],
    { restaurant: 0, visit: 0, park: 0 },
    [],
    null,
    'museum',
  );
  assert.equal(ordered[0].placeId, 'muchas');
});

test('el ranking deduplica, excluye y reserva diversidad sin inventar afinidad', () => {
  const ranking = loader()('src/utils/explore-ranking.ts');
  const museum = makePlace('museo', { types: ['museum'], rating: 3, ratingCount: 10 });
  const ordered = ranking.rankExplorePlaces(
    [
      makePlace('excluido', { rating: 5, ratingCount: 500 }),
      makePlace('a', { types: ['restaurant'], rating: 4.8, ratingCount: 500 }),
      makePlace('a', { types: ['restaurant'], rating: 4.8, ratingCount: 500 }),
      makePlace('b', { types: ['restaurant'], rating: 4.7, ratingCount: 500 }),
      museum,
    ],
    { restaurant: 0, visit: 0, park: 0 },
    ['excluido'],
    null,
    'museum',
    2,
  );
  assert.equal(new Set(ordered.map((place) => place.placeId)).size, ordered.length);
  assert.equal(ordered.some((place) => place.placeId === 'excluido'), false);
  assert.equal(ordered.some((place) => place.placeId === 'museo'), true);
  assert.equal(ranking.chooseExploratoryCategory({ restaurant: 0, visit: 0, park: 0 }), 'museum');
});

test('el adaptador conserva Gratis, usa null y no sustituye resumen por dirección', () => {
  const load = loader();
  const google = load('supabase/functions/places/google.ts');
  const raw = {
    id: 'poi',
    displayName: { text: 'Museo' },
    formattedAddress: 'Calle 1',
    types: ['museum'],
    primaryType: 'museum',
    rating: 4.6,
    userRatingCount: 12,
    priceLevel: 'PRICE_LEVEL_FREE',
    addressComponents: [
      { types: ['country'], shortText: 'es', longText: 'España' },
      { types: ['locality'], longText: 'Madrid' },
    ],
  };
  const result = google.mapGoogleExplorePlace(raw);
  assert.equal(result.priceLevel, 'free');
  assert.equal(result.countryCode, 'ES');
  assert.equal(result.localityName, 'Madrid');
  const content = google.mapGoogleContent(raw);
  assert.equal(content.description, null);
  assert.equal(content.place.address, 'Calle 1');
  assert.equal(
    google.mapGoogleExplorePlace({ ...raw, types: ['locality'] }).priceLevel,
    null,
  );
});

test('editorialSummary conserva el texto original y acepta idioma regional', () => {
  const google = loader()('supabase/functions/places/google.ts');
  const content = google.mapGoogleContent({
    id: 'city',
    displayName: { text: 'Ciudad' },
    types: ['locality'],
    editorialSummary: { text: '  Texto del proveedor  ', languageCode: 'es-MX' },
  });
  assert.equal(content.description.text, '  Texto del proveedor  ');
  assert.equal(content.description.languageCode, 'es-MX');
});

test('el cliente valida contenido y la identidad de las fotos dinámicas', async () => {
  const details = {
    ...makePlace('poi'),
    viewport: null,
    googleMapsUri: null,
  };
  const content = {
    place: details,
    rating: null,
    ratingCount: null,
    priceLevel: null,
    description: null,
  };
  const contentApi = placesClient(async (_name, options) => ({
    data: { data: { content } },
    error: null,
  }));
  assert.equal((await contentApi.getPlaceContent('poi', 'es')).description, null);

  const photoApi = placesClient(async () => ({
    data: {
      data: {
        photo: {
          placeId: 'otro',
          uri: 'https://images.test/photo',
          widthPx: 480,
          heightPx: 320,
          credits: [],
        },
      },
    },
    error: null,
  }));
  await assert.rejects(photoApi.getPlacePhoto('poi', 'card', 'es'), {
    code: 'INVALID_RESPONSE',
  });
});

test('la prioridad fotográfica evita Google cuando Unsplash funciona', async () => {
  const fallback = loader()('src/utils/place-photo-fallback.ts');
  let googleCalls = 0;
  const selected = await fallback.resolveInitialPhoto(
    async () => ({ id: 'unsplash' }),
    async () => {
      googleCalls++;
      return { id: 'google' };
    },
    () => false,
  );
  assert.equal(selected.provider, 'unsplash');
  assert.equal(googleCalls, 0);
});

test('vacío o fallo de Unsplash activa Google, pero cancelación no', async () => {
  const fallback = loader()('src/utils/place-photo-fallback.ts');
  let googleCalls = 0;
  const selected = await fallback.resolveInitialPhoto(
    async () => null,
    async () => {
      googleCalls++;
      return { id: 'google' };
    },
    () => false,
  );
  assert.equal(selected.provider, 'google');
  assert.equal(googleCalls, 1);
  const cancelled = new Error('cancelled');
  await assert.rejects(
    fallback.resolveInitialPhoto(
      async () => {
        throw cancelled;
      },
      async () => {
        googleCalls++;
        return null;
      },
      (error) => error === cancelled,
    ),
    /cancelled/,
  );
  assert.equal(googleCalls, 1);
});

test('Unsplash valida su respuesta y deduplica búsquedas simultáneas', async () => {
  const previousKey = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
  process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY = 'test-key';
  let finish;
  let calls = 0;
  const load = loader({
    __fetch: async () => {
      calls++;
      return new Promise((resolve) => {
        finish = () => resolve(new Response(JSON.stringify({
          results: [{
            id: 'photo-1',
            alt_description: null,
            urls: {
              thumb: 'https://images.test/thumb',
              small: 'https://images.test/small',
              regular: 'https://images.test/regular',
            },
            user: { name: 'Ana', links: { html: 'https://unsplash.com/@ana' } },
            links: {
              html: 'https://unsplash.com/photos/photo-1',
              download_location: 'https://api.unsplash.com/photos/photo-1/download',
            },
          }],
        }), { status: 200 }));
      });
    },
  });
  const unsplash = load('src/services/unsplash.ts');
  const first = unsplash.searchPhotos('Madrid', 1);
  const second = unsplash.searchPhotos('Madrid', 1);
  finish();
  const [a, b] = await Promise.all([first, second]);
  assert.equal(calls, 1);
  assert.equal(a[0].id, 'photo-1');
  assert.equal(b[0].photoLink, 'https://unsplash.com/photos/photo-1');
  if (previousKey === undefined) delete process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
  else process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY = previousKey;
});

test('Unsplash no convierte JSON malformado en una lista vacía', async () => {
  const previousKey = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
  process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY = 'test-key';
  const unsplash = loader({
    __fetch: async () => new Response(JSON.stringify({ results: 'incorrecto' }), { status: 200 }),
  })('src/services/unsplash.ts');
  await assert.rejects(unsplash.searchPhotos('Madrid', 1), /Respuesta no válida/);
  if (previousKey === undefined) delete process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
  else process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY = previousKey;
});

test('un fallo al renderizar recorre Unsplash, Google, renovación y placeholder', () => {
  const fallback = loader()('src/utils/place-photo-fallback.ts');
  assert.equal(
    JSON.stringify(fallback.photoImageFailureAction('unsplash', 0)),
    JSON.stringify({ kind: 'request_google', load: 1 }),
  );
  assert.equal(
    JSON.stringify(fallback.photoImageFailureAction('google', 1)),
    JSON.stringify({ kind: 'request_google', load: 2 }),
  );
  assert.equal(
    JSON.stringify(fallback.photoImageFailureAction('google', 2)),
    JSON.stringify({ kind: 'show_placeholder' }),
  );
});

function emptyDiscoveryClient(log) {
  return {
    from(table) {
      const filters = [];
      const builder = {
        select() { return builder; },
        eq(column, value) { filters.push(['eq', column, value]); return builder; },
        lte(column, value) { filters.push(['lte', column, value]); return builder; },
        gte(column, value) { filters.push(['gte', column, value]); return builder; },
        gt(column, value) { filters.push(['gt', column, value]); return builder; },
        lt(column, value) { filters.push(['lt', column, value]); return builder; },
        in(column, value) { filters.push(['in', column, value]); return builder; },
        order() { return builder; },
        limit() { return builder; },
        then(resolve) {
          log.push({ table, filters });
          resolve({ data: [], error: null });
        },
      };
      return builder;
    },
  };
}

test('el descubrimiento usa la región del dispositivo y filtra siempre por usuario', async () => {
  const queryLog = [];
  const googleLog = [];
  const load = loader({
    './google.ts': {
      PlacesHttpError: class PlacesHttpError extends Error {},
      googleBrowseText: async (search) => {
        googleLog.push(search.query);
        return { places: [makePlace(search.query)], nextPageToken: null };
      },
      googleBrowseNearby: async () => ({ places: [], nextPageToken: null }),
      googleDetails: async () => { throw new Error('No debe resolver viajes'); },
      googleDiscoverCities: async () => [],
      googleNearbyCities: async () => [],
    },
  });
  const discovery = load('supabase/functions/places/discovery.ts');
  const limits = [];
  const result = await discovery.discoverPlacesOnServer({
    userClient: emptyDiscoveryClient(queryLog),
    userId: 'user-A',
    apiKey: 'test',
    request: {
      action: 'discover',
      mode: 'places',
      languageCode: 'es',
      fallbackCountryCode: 'MX',
      timeZone: 'America/Mexico_City',
    },
    defaultCountryCode: 'ES',
    consume: async (action) => limits.push(action),
  });
  assert.equal(result.area.countryCode, 'MX');
  assert.equal(result.area.source, 'device');
  assert.equal(googleLog.length, 2);
  assert.equal(limits.filter((action) => action === 'textSearch').length, 2);
  assert.equal(
    queryLog
      .filter((entry) => entry.table === 'trips')
      .every((entry) => entry.filters.some((filter) => filter[0] === 'eq' && filter[1] === 'user_id' && filter[2] === 'user-A')),
    true,
  );
});

test('un fallo de una rama conserva la otra como resultado parcial', async () => {
  const load = loader({
    './google.ts': {
      PlacesHttpError: class PlacesHttpError extends Error {},
      googleBrowseText: async (search) => {
        if (search.query.startsWith('tourist')) throw new Error('timeout');
        return { places: [makePlace('museo', { types: ['museum'] })], nextPageToken: null };
      },
      googleBrowseNearby: async () => ({ places: [], nextPageToken: null }),
      googleDetails: async () => { throw new Error('No debe resolver viajes'); },
      googleDiscoverCities: async () => [],
      googleNearbyCities: async () => [],
    },
  });
  const discovery = load('supabase/functions/places/discovery.ts');
  const result = await discovery.discoverPlacesOnServer({
    userClient: emptyDiscoveryClient([]),
    userId: 'user-A',
    apiKey: 'test',
    request: { action: 'discover', mode: 'places', languageCode: 'es' },
    defaultCountryCode: 'ES',
    consume: async () => {},
  });
  assert.equal(result.partial, true);
  assert.equal(result.places[0].placeId, 'museo');
});
