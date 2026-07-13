import { es, enUS } from 'date-fns/locale';
import i18n from '@/i18n';

/** Locale de date-fns acorde al idioma activo de la app. */
export function dateLocale() {
  return i18n.language === 'es' ? es : enUS;
}
