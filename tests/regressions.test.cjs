/* global __dirname */
const test = require('node:test');
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
    const requireLocal = (name) => {
      if (name in mocks) return mocks[name];
      let local = name.startsWith('@/')
        ? 'src/' + name.slice(2)
        : name.startsWith('.')
          ? path.posix.join(path.posix.dirname(relative), name)
          : null;
      if (!local) return require(name);
      if (!/\.(tsx?|json)$/.test(local)) local += '.ts';
      return load(local);
    };
    vm.runInNewContext(
      compile(fs.readFileSync(path.join(root, relative), 'utf8')),
      {
        module,
        exports: module.exports,
        require: requireLocal,
        console,
      },
      { filename: relative },
    );
    return module.exports;
  }
  return load;
}

// Ejecuta el callback real de la pantalla con sus dependencias controladas,
// sin copiar su implementación ni necesitar un simulador para ordenar respuestas.
function screenAction(file, name, scope) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let action;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name) {
      action = ts.isCallExpression(node.initializer)
        ? node.initializer.arguments[0]
        : node.initializer;
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(action, `No se encontró ${name}`);
  const module = { exports: {} };
  vm.runInNewContext(compile(`module.exports = ${action.getText(ast)}`), { module, ...scope });
  return module.exports;
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
const tick = () => new Promise((resolve) => setImmediate(resolve));
const expense = (id) => ({
  id,
  tripId: 'trip',
  amount: 10,
  currency: 'EUR',
  date: '2026-09-19',
  category: 'other',
});

function expenses(services) {
  const load = loader({ '@/services/expenses': services, '@/i18n': { t: (key) => key } });
  const account = load('src/services/account-session.ts');
  account.setAccountOwner('A');
  return { account, store: load('src/store/expenseStore.ts').useExpenseStore };
}

test('una lectura antigua no oculta un gasto guardado después de iniciarla', async () => {
  const oldRead = deferred();
  let calls = 0;
  const { store } = expenses({
    listExpenses: () => (++calls === 1 ? oldRead.promise : Promise.resolve([expense('new')])),
    createExpense: async () => expense('new'),
  });
  const reading = store.getState().loadExpenses('trip');
  await store.getState().addExpense(expense('new'));
  oldRead.resolve([]);
  await reading;
  assert.equal(calls, 2);
  assert.equal(store.getState().byTrip.trip[0].id, 'new');
});

test('recargar durante un guardado espera y conserva el gasto optimista', async () => {
  const saving = deferred();
  let calls = 0;
  const { store } = expenses({
    listExpenses: async () => {
      calls++;
      return [expense('new')];
    },
    createExpense: () => saving.promise,
  });
  const writing = store.getState().addExpense(expense('new'));
  const reading = store.getState().loadExpenses('trip');
  await tick();
  assert.equal(calls, 0);
  assert.equal(store.getState().byTrip.trip.length, 1);
  saving.resolve(expense('new'));
  await Promise.all([writing, reading]);
  assert.equal(store.getState().byTrip.trip[0].id, 'new');
  assert.equal(store.getState().loadingByTrip.trip, false);
});

test('dos cargas fuera de orden conservan la respuesta de la última solicitud', async () => {
  const first = deferred(),
    second = deferred();
  let calls = 0;
  const { store } = expenses({
    listExpenses: () => (++calls === 1 ? first.promise : second.promise),
  });
  const a = store.getState().loadExpenses('trip');
  const b = store.getState().loadExpenses('trip');
  second.resolve([expense('latest')]);
  await b;
  first.resolve([expense('old')]);
  await a;
  assert.equal(store.getState().byTrip.trip[0].id, 'latest');
});

test('un guardado fallido desbloquea la recarga y elimina el temporal', async () => {
  const saving = deferred();
  const { store } = expenses({ listExpenses: async () => [], createExpense: () => saving.promise });
  const writing = assert.rejects(store.getState().addExpense(expense('new')), /offline/);
  const reading = store.getState().loadExpenses('trip');
  saving.reject(new Error('offline'));
  await Promise.all([writing, reading]);
  assert.equal(store.getState().byTrip.trip.length, 0);
  assert.equal(store.getState().loadingByTrip.trip, false);
});

test('cambiar de cuenta libera la espera y no incorpora la escritura anterior', async () => {
  const saving = deferred();
  let calls = 0;
  const { store, account } = expenses({
    listExpenses: async () => {
      calls++;
      return [];
    },
    createExpense: () => saving.promise,
  });
  const writing = assert.rejects(store.getState().addExpense(expense('new')), /SESSION_CHANGED/);
  const reading = store.getState().loadExpenses('trip');
  account.setAccountOwner('B');
  await reading;
  saving.resolve(expense('new'));
  await writing;
  assert.equal(calls, 0);
  assert.equal(Object.keys(store.getState().byTrip).length, 0);
});

for (const change of ['none', 'B', 'A-again']) {
  test(`borrado de cuenta: respuesta tardía con sesión ${change}`, async () => {
    const account = loader()('src/services/account-session.ts');
    account.setAccountOwner('A');
    const pending = deferred();
    let profile = { id: 'A' },
      signOuts = 0,
      alerts = 0;
    const action = screenAction('src/app/(app)/settings.tsx', 'performDelete', {
      ...account,
      supabase: { functions: { invoke: () => pending.promise } },
      useProfileStore: {
        getState: () => ({ profile }),
        setState: (state) => {
          profile = state.profile;
        },
      },
      signOut: async () => {
        signOuts++;
      },
      t: (key) => key,
      Alert: {
        alert: () => {
          alerts++;
        },
      },
    });
    const running = action();
    if (change !== 'none') {
      account.setAccountOwner('B');
      profile = { id: 'B' };
      if (change === 'A-again') {
        account.setAccountOwner('A');
        profile = { id: 'A' };
      }
    }
    pending.resolve({ data: { status: 'pending' }, error: null });
    await running;
    assert.equal(!!profile.deletionRequestedAt, change === 'none');
    assert.equal(signOuts, change === 'none' ? 1 : 0);
    assert.equal(alerts, change === 'none' ? 1 : 0);
  });
}

function tripForm(overrides = {}) {
  const account = loader()('src/services/account-session.ts');
  account.setAccountOwner('A');
  const updates = [],
    alerts = [],
    calls = { create: 0, remove: 0, upload: 0, back: 0 };
  const scope = {
    ...account,
    submitting: { current: false },
    savedTripId: { current: null },
    selectingDestination: false,
    referencePending: false,
    destinationPlaceId: null,
    title: 'Viaje',
    destination: 'Personal',
    startDate: new Date(2026, 8, 19),
    endDate: new Date(2026, 8, 20),
    budget: '1.234,56',
    currency: 'USD',
    tripType: null,
    referenceChanged: false,
    isEdit: true,
    id: 'trip',
    userId: 'A',
    coverRemoved: true,
    pickedCover: { base64: 'image' },
    t: (key) => key,
    setSaving: () => {},
    Alert: { alert: (...args) => alerts.push(args) },
    parseAmount: loader()('src/utils/parseAmount.ts').parseAmount,
    toISODate: (date) => require('date-fns').format(date, 'yyyy-MM-dd'),
    editTrip: async (id, patch) => updates.push({ id, patch }),
    addTrip: async () => {
      calls.create++;
      return { id: 'created' };
    },
    uploadTripCover: async () => {
      calls.upload++;
      return 'new-cover';
    },
    deleteTripCover: async () => {
      calls.remove++;
    },
    router: {
      back: () => {
        calls.back++;
      },
    },
    console,
    ...overrides,
  };
  return {
    scope,
    account,
    updates,
    alerts,
    calls,
    save: screenAction('src/app/(app)/trips/new.tsx', 'handleSubmit', scope),
  };
}

test('una portada seleccionada prevalece sobre la retirada anterior', async () => {
  const form = tripForm();
  await form.save();
  assert.equal(form.calls.upload, 1);
  assert.equal(form.calls.remove, 0);
  assert.equal(form.updates.at(-1).patch.coverImage, 'new-cover');
  assert.equal(form.updates[0].patch.budget, 1234.56);
  assert.equal(form.updates[0].patch.currency, 'USD');
});

test('fallo y reintento de portada conserva un solo viaje', async () => {
  let uploads = 0;
  const form = tripForm({
    isEdit: false,
    id: undefined,
    uploadTripCover: async () => {
      if (++uploads === 1) throw new Error('offline');
      return 'cover';
    },
  });
  await form.save();
  assert.equal(form.alerts[0][1], 'fixes.coverSavedPartially');
  await form.save();
  assert.equal(form.calls.create, 1);
  assert.equal(form.updates.at(-1).patch.coverImage, 'cover');
});

test('cambiar de sesión durante la subida no modifica el viaje ni navega después', async () => {
  const pending = deferred();
  const form = tripForm({ uploadTripCover: () => pending.promise });
  const running = form.save();
  await tick();
  form.account.setAccountOwner('B');
  pending.resolve('cover-A');
  await running;
  assert.equal(form.updates.length, 1);
  assert.equal(form.calls.back, 0);
  assert.equal(form.alerts.length, 0);
});

test('Google Sign-In 8 envía idToken a Supabase, no user.id', async () => {
  let sent;
  const load = loader({
    '@/services/supabase': {
      supabase: {
        auth: {
          signInWithIdToken: async (input) => {
            sent = input;
            return { error: null };
          },
        },
      },
    },
    '@/services/place-session': { setPlaceOwner: () => {} },
    '@/store/itineraryRefreshStore': {
      useItineraryRefreshStore: { getState: () => ({ reset: () => {} }) },
    },
    '@/constants/auth': { getAuthCallbackUrl: () => 'tripmate://callback' },
    'expo-web-browser': {},
    'expo-auth-session/build/QueryParams': {},
    '@react-native-google-signin/google-signin': {
      GoogleSignin: {
        configure: () => {},
        hasPlayServices: async () => {},
        signIn: async () => ({ user: { id: 'google-user-id' }, idToken: 'signed-id-token' }),
      },
    },
  });
  await load('src/store/authStore.ts').useAuthStore.getState().signInWithGoogle();
  assert.equal(sent.token, 'signed-id-token');
  assert.equal(sent.provider, 'google');
});
const editorial = {
  id: 'lisboa',
  name: 'Lisboa',
  country: 'Portugal',
  countryCode: 'PT',
  placeId: null,
};
const lisboa = {
  placeId: 'google-lisboa',
  name: 'Lisboa',
  countryName: 'Portugal',
  countryCode: 'PT',
  types: ['locality'],
};
test('el catálogo sin Place ID se vincula por ciudad y país, tolerando acentos', () => {
  const { matchesEditorialPlace } = loader()('src/utils/editorial-place.ts');
  assert.equal(matchesEditorialPlace(editorial, lisboa), true);
  assert.equal(
    matchesEditorialPlace(
      { ...editorial, name: 'Málaga', countryCode: 'ES' },
      { ...lisboa, name: 'Malaga', countryCode: 'ES' },
    ),
    true,
  );
});
test('no se vincula una ciudad homónima de otro país ni un comercio del mismo nombre', () => {
  const { matchesEditorialPlace } = loader()('src/utils/editorial-place.ts');
  assert.equal(matchesEditorialPlace(editorial, { ...lisboa, countryCode: 'BR' }), false);
  assert.equal(matchesEditorialPlace(editorial, { ...lisboa, types: ['restaurant'] }), false);
  assert.equal(
    matchesEditorialPlace(editorial, { ...lisboa, countryCode: null, countryName: null }),
    false,
  );
});
test('un Place ID editorial explícito prevalece sobre el nombre traducido', () => {
  const { matchesEditorialPlace } = loader()('src/utils/editorial-place.ts');
  assert.equal(
    matchesEditorialPlace({ ...editorial, placeId: lisboa.placeId }, { ...lisboa, name: 'Lisbon' }),
    true,
  );
  assert.equal(matchesEditorialPlace({ ...editorial, placeId: 'other' }, lisboa), false);
});
