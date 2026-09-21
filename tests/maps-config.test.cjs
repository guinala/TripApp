/* global __dirname, process */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function introspect(key) {
  return spawnSync(
    process.execPath,
    ['node_modules/expo/bin/cli', 'config', '--type', 'introspect', '--json'],
    {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
      env: { ...process.env, EXPO_NO_DOTENV: '1', GOOGLE_MAPS_ANDROID_API_KEY: key },
    },
  );
}

test('Android no se genera sin la clave de Maps', () => {
  const result = introspect('');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Falta GOOGLE_MAPS_ANDROID_API_KEY/);
});

test('la clave llega al AndroidManifest a través del plugin de Maps', () => {
  const result = introspect('test-only-maps-key');
  assert.equal(result.status, 0, 'La introspección de Expo debe completar correctamente');
  const config = JSON.parse(result.stdout);
  const metadata =
    config._internal.modResults.android.manifest.manifest.application[0]['meta-data'];
  const entry = metadata.find(
    (item) => item.$['android:name'] === 'com.google.android.geo.API_KEY',
  );
  assert.equal(entry?.$['android:value'], 'test-only-maps-key');
});
