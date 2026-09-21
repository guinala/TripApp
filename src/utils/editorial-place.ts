import type { EditorialDestination } from '@/types/destination';
import type { PlaceDetails } from '@/types/place';

export const isDestination = (types: string[]) =>
  types.some((type) =>
    [
      'locality',
      'postal_town',
      'country',
      'administrative_area_level_1',
      'administrative_area_level_2',
      'administrative_area_level_3',
      'archipelago',
    ].includes(type),
  );

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

// Un nombre coincidente no basta: puede haber ciudades homónimas en otros países.
export function matchesEditorialPlace(destination: EditorialDestination, place: PlaceDetails) {
  if (destination.placeId) return destination.placeId === place.placeId;
  return (
    isDestination(place.types) &&
    normalize(destination.name) === normalize(place.name) &&
    (destination.countryCode && place.countryCode
      ? destination.countryCode === place.countryCode
      : !!place.countryName && normalize(destination.country) === normalize(place.countryName))
  );
}
