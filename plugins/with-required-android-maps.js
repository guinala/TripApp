const { withAndroidManifest } = require('@expo/config-plugins');

// Se ejecuta al generar Android, no al abrir Expo Go ni al exportar la web.
module.exports = function withRequiredAndroidMaps(config, { apiKey } = {}) {
  return withAndroidManifest(config, (mod) => {
    if (typeof apiKey !== 'string' || !apiKey.trim()) {
      throw new Error(
        'Falta GOOGLE_MAPS_ANDROID_API_KEY. Configúrala en el entorno EAS del perfil utilizado (development, preview o production) antes de compilar Android.',
      );
    }
    return mod;
  });
};
