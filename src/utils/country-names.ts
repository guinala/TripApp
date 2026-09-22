const COUNTRY_NAMES: Record<string, { es: string; en: string }> = {
  AD: { es: 'Andorra', en: 'Andorra' },
  AE: { es: 'Emiratos Árabes Unidos', en: 'United Arab Emirates' },
  AF: { es: 'Afganistán', en: 'Afghanistan' },
  AL: { es: 'Albania', en: 'Albania' },
  AR: { es: 'Argentina', en: 'Argentina' },
  AT: { es: 'Austria', en: 'Austria' },
  AU: { es: 'Australia', en: 'Australia' },
  BA: { es: 'Bosnia y Herzegovina', en: 'Bosnia and Herzegovina' },
  BE: { es: 'Bélgica', en: 'Belgium' },
  BG: { es: 'Bulgaria', en: 'Bulgaria' },
  BO: { es: 'Bolivia', en: 'Bolivia' },
  BR: { es: 'Brasil', en: 'Brazil' },
  CA: { es: 'Canadá', en: 'Canada' },
  CH: { es: 'Suiza', en: 'Switzerland' },
  CL: { es: 'Chile', en: 'Chile' },
  CN: { es: 'China', en: 'China' },
  CO: { es: 'Colombia', en: 'Colombia' },
  CR: { es: 'Costa Rica', en: 'Costa Rica' },
  CU: { es: 'Cuba', en: 'Cuba' },
  CZ: { es: 'República Checa', en: 'Czech Republic' },
  DE: { es: 'Alemania', en: 'Germany' },
  DK: { es: 'Dinamarca', en: 'Denmark' },
  DO: { es: 'República Dominicana', en: 'Dominican Republic' },
  EC: { es: 'Ecuador', en: 'Ecuador' },
  EE: { es: 'Estonia', en: 'Estonia' },
  EG: { es: 'Egipto', en: 'Egypt' },
  ES: { es: 'España', en: 'Spain' },
  FI: { es: 'Finlandia', en: 'Finland' },
  FR: { es: 'Francia', en: 'France' },
  GB: { es: 'Reino Unido', en: 'United Kingdom' },
  GR: { es: 'Grecia', en: 'Greece' },
  GT: { es: 'Guatemala', en: 'Guatemala' },
  HN: { es: 'Honduras', en: 'Honduras' },
  HR: { es: 'Croacia', en: 'Croatia' },
  HU: { es: 'Hungría', en: 'Hungary' },
  ID: { es: 'Indonesia', en: 'Indonesia' },
  IE: { es: 'Irlanda', en: 'Ireland' },
  IL: { es: 'Israel', en: 'Israel' },
  IN: { es: 'India', en: 'India' },
  IS: { es: 'Islandia', en: 'Iceland' },
  IT: { es: 'Italia', en: 'Italy' },
  JM: { es: 'Jamaica', en: 'Jamaica' },
  JP: { es: 'Japón', en: 'Japan' },
  KE: { es: 'Kenia', en: 'Kenya' },
  KR: { es: 'Corea del Sur', en: 'South Korea' },
  LU: { es: 'Luxemburgo', en: 'Luxembourg' },
  MA: { es: 'Marruecos', en: 'Morocco' },
  MC: { es: 'Mónaco', en: 'Monaco' },
  ME: { es: 'Montenegro', en: 'Montenegro' },
  MX: { es: 'México', en: 'Mexico' },
  MY: { es: 'Malasia', en: 'Malaysia' },
  NI: { es: 'Nicaragua', en: 'Nicaragua' },
  NL: { es: 'Países Bajos', en: 'Netherlands' },
  NO: { es: 'Noruega', en: 'Norway' },
  NZ: { es: 'Nueva Zelanda', en: 'New Zealand' },
  PA: { es: 'Panamá', en: 'Panama' },
  PE: { es: 'Perú', en: 'Peru' },
  PH: { es: 'Filipinas', en: 'Philippines' },
  PL: { es: 'Polonia', en: 'Poland' },
  PR: { es: 'Puerto Rico', en: 'Puerto Rico' },
  PT: { es: 'Portugal', en: 'Portugal' },
  PY: { es: 'Paraguay', en: 'Paraguay' },
  RO: { es: 'Rumanía', en: 'Romania' },
  RS: { es: 'Serbia', en: 'Serbia' },
  RU: { es: 'Rusia', en: 'Russia' },
  SE: { es: 'Suecia', en: 'Sweden' },
  SG: { es: 'Singapur', en: 'Singapore' },
  SI: { es: 'Eslovenia', en: 'Slovenia' },
  SK: { es: 'Eslovaquia', en: 'Slovakia' },
  SV: { es: 'El Salvador', en: 'El Salvador' },
  TH: { es: 'Tailandia', en: 'Thailand' },
  TN: { es: 'Túnez', en: 'Tunisia' },
  TR: { es: 'Turquía', en: 'Turkey' },
  UA: { es: 'Ucrania', en: 'Ukraine' },
  UK: { es: 'Reino Unido', en: 'United Kingdom' },
  US: { es: 'Estados Unidos', en: 'United States' },
  UY: { es: 'Uruguay', en: 'Uruguay' },
  VA: { es: 'Ciudad del Vaticano', en: 'Vatican City' },
  VE: { es: 'Venezuela', en: 'Venezuela' },
  VN: { es: 'Vietnam', en: 'Vietnam' },
  ZA: { es: 'Sudáfrica', en: 'South Africa' },
};

export function getCountryDisplayName(code?: string, language: string = 'es'): string | undefined {
  if (!code || typeof code !== 'string') return undefined;
  const upper = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return code;

  const langKey = language.startsWith('en') ? 'en' : 'es';
  const entry = COUNTRY_NAMES[upper];
  if (entry) return entry[langKey];

  if (typeof Intl !== 'undefined' && typeof (Intl as unknown as { DisplayNames?: unknown }).DisplayNames === 'function') {
    try {
      const name = new Intl.DisplayNames([language], { type: 'region' }).of(upper);
      if (name && name !== upper) return name;
    } catch {
      // Fallback
    }
  }

  return upper;
}

export function formatAreaLabel(
  manualLabel?: string,
  feedLabel?: string,
  fallbackCode?: string,
  languageCode: string = 'es',
): string {
  if (manualLabel) return manualLabel;
  if (feedLabel) {
    if (/^[A-Z]{2}$/i.test(feedLabel)) {
      return getCountryDisplayName(feedLabel, languageCode) ?? feedLabel;
    }
    return feedLabel;
  }
  if (fallbackCode) {
    return getCountryDisplayName(fallbackCode, languageCode) ?? fallbackCode;
  }
  return '-';
}
