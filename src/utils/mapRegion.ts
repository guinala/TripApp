import { DESTINATIONS } from '@/constants/destinations';

export type LatLng = { lat: number; lng: number };

const DESTINATION_ALIASES: Record<string, string> = {
  rome: 'roma',
  tokyo: 'tokio',
};

const EXTRA_DESTINATIONS: Record<string, LatLng> = {
  ginebra: { lat: 46.2044, lng: 6.1432 },
  geneva: { lat: 46.2044, lng: 6.1432 },
};

export function normalizeDestination(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function destinationCoordinates(destination: string): LatLng | undefined {
  const normalized = normalizeDestination(destination);
  const key = DESTINATION_ALIASES[normalized] ?? normalized;
  return (
    EXTRA_DESTINATIONS[key] ??
    DESTINATIONS.find((item) => normalizeDestination(item.name) === key)?.coordinates
  );
}

export function isValidCoordinate(value: LatLng | null | undefined): value is LatLng {
  return (
    value != null &&
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng) &&
    value.lat >= -90 &&
    value.lat <= 90 &&
    value.lng >= -180 &&
    value.lng <= 180
  );
}

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export function regionForPoints(points: LatLng[], marginFactor = 1.4): MapRegion | undefined {
  if (points.length === 0) return undefined;

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * marginFactor, 0.02),
    longitudeDelta: Math.max((maxLng - minLng) * marginFactor, 0.02),
  };
}
