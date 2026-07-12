import 'intl-pluralrules';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { useUIStore } from '@/store/uiStore';
import es from './locales/es.json';
import en from './locales/en.json';

const SUPPORTED = ['es', 'en'];

function resolveInitialLanguage(): string {
  const cached = useUIStore.getState().language;
  if (SUPPORTED.includes(cached)) return cached;
  const device = getLocales()[0]?.languageCode ?? 'es';
  return SUPPORTED.includes(device) ? device : 'es';
}

i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: resolveInitialLanguage(),
  fallbackLng: 'es',
  interpolation: { escapeValue: false }, // React ya escapa; sin esto verías &#39; en pantalla
});

/** Único punto de cambio de idioma: i18next + caché local a la vez */
export function syncLanguage(lang: string) {
  if (i18n.language !== lang) i18n.changeLanguage(lang);
  useUIStore.getState().setLanguage(lang);
}

// La rehidratación de zustand/persist es ASÍNCRONA: en el primer tick,
// getState().language puede ser el default 'es' aunque AsyncStorage tenga 'en'.
// Este hook corrige el idioma en cuanto termina de rehidratar.
useUIStore.persist.onFinishHydration((state) => {
  if (SUPPORTED.includes(state.language)) syncLanguage(state.language);
});

export default i18n;