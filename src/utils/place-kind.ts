const CITY_TYPES = new Set(['locality', 'postal_town']);
const GEOGRAPHIC_TYPES = new Set([
  ...CITY_TYPES,
  'country',
  'administrative_area_level_1',
  'administrative_area_level_2',
  'administrative_area_level_3',
  'archipelago',
]);

export const isCity = (types: string[]) => types.some((type) => CITY_TYPES.has(type));

export const isGeographicDestination = (types: string[]) =>
  types.some((type) => GEOGRAPHIC_TYPES.has(type));

export const supportsNearbyPlaces = (types: string[]) =>
  isGeographicDestination(types) &&
  !types.includes('country') &&
  !types.includes('archipelago');
