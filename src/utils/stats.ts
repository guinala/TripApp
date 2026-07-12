import { listTrips } from '@/services/trips';
import { listActivitiesByTrip } from '@/services/activities';
import { countryNameToIso, normalizeCountryName } from '@/constants/countryCodes';
import type { LatLng } from '@/utils/mapRegion';
import type { UserStats } from '@/types/stats';

export function extractCountry(destination: string): string {
  const parts = destination.split(',');
  return parts[parts.length - 1].trim();
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function centroid(points: LatLng[]): LatLng | null {
  if (points.length === 0) return null;
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  return { lat, lng };
}

/**
 * Calculate profile's stats within compelted trips
 */
export async function getUserStats(userId: string, origin?: LatLng | null): Promise<UserStats> {
  const trips = (await listTrips(userId)).filter((t) => t.status === 'completed');

  const countryKeys = new Set<string>();
  const isoCodes = new Set<string>();
  for (const trip of trips) {
    const country = extractCountry(trip.destination);
    const iso = countryNameToIso(country);
    if (iso) {
      countryKeys.add(iso);
      isoCodes.add(iso);
    } else {
      countryKeys.add(normalizeCountryName(country));
    }
  }

  let kilometers: number | null = null;
  if (origin) {
    let total = 0;
    let computedAny = false;
    for (const trip of trips) {
      const activities = await listActivitiesByTrip(trip.id);
      const located = activities.filter((a) => a.location != null).map((a) => a.location as LatLng);
      const center = centroid(located);
      if (center) {
        total += haversineKm(origin, center);
        computedAny = true;
      }
    }
    kilometers = computedAny ? Math.round(total) : null;
  }

  return {
    tripCount: trips.length,
    countriesCount: countryKeys.size,
    countryCodes: [...isoCodes],
    kilometers,
  };
}
