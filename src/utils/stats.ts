import { listTrips } from "@/services/trips";
import { listActivitiesByTrip } from "@/services/activities";
import { countryNameToIso } from "@/constants/countryCodes";
import { isValidCoordinate, type LatLng } from "@/utils/mapRegion";
import {
  placeSessionVersion,
  readPlace,
  resolvePlace,
} from "@/services/place-session";
import type { PlaceDetails, PlaceLanguage } from "@/types/place";
import type { UserStats } from "@/types/stats";

export function extractCountry(destination: string): string {
  return destination.split(",").at(-1)?.trim() ?? "";
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const radians = Math.PI / 180;

  const h = Math.sin(((b.lat - a.lat) * radians) / 2) ** 2 +
    Math.cos(a.lat * radians) *
      Math.cos(b.lat * radians) *
      Math.sin(((b.lng - a.lng) * radians) / 2) ** 2;

  return 12742 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

function centroid(points: LatLng[]): LatLng | null {
  if (!points.length) return null;

  return {
    lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
    lng: (Math.atan2(
      points.reduce((sum, p) => sum + Math.sin((p.lng * Math.PI) / 180), 0),
      points.reduce((sum, p) => sum + Math.cos((p.lng * Math.PI) / 180), 0),
    ) *
      180) /
      Math.PI,
  };
}

export async function getUserStats(
  userId: string,
  origin?: LatLng | null,
  language: PlaceLanguage = "es",
  signal?: AbortSignal,
): Promise<UserStats> {
  const epoch = placeSessionVersion();

  const check = () => {
    if (signal?.aborted || epoch !== placeSessionVersion()) {
      throw new Error("Consulta cancelada");
    }
  };

  const trips = (await listTrips(userId)).filter((t) =>
    t.status === "completed"
  );

  check();

  const codes = new Set<string>();

  let unresolvedDestinationsCount = 0,
    resolutionFailures = 0,
    requested = 0;

  const resolved = new Map<string, PlaceDetails | null>();

  const details = async (id: string): Promise<PlaceDetails | null> => {
    check();

    if (resolved.has(id)) return resolved.get(id)!;

    const cached = readPlace(id, language);

    if (cached) {
      resolved.set(id, cached);
      return cached;
    }

    if (requested >= 12) return null;

    requested++;

    try {
      const place = await resolvePlace(id, language);
      check();
      resolved.set(id, place);
      return place;
    } catch {
      check();
      resolutionFailures++;
      resolved.set(id, null);
      return null;
    }
  };

  for (const trip of trips) {
    check();
    const code = trip.destinationPlaceId
      ? (await details(trip.destinationPlaceId))?.countryCode
      : countryNameToIso(extractCountry(trip.destination));
    if (code && /^[A-Z]{2}$/.test(code)) codes.add(code);
    else unresolvedDestinationsCount++;
  }

  let total = 0,
    computed = false,
    kilometersPartial = false;

  if (origin && isValidCoordinate(origin)) {
    for (const trip of trips) {
      check();
      const activities = await listActivitiesByTrip(trip.id);
      const points: LatLng[] = [];
      for (const activity of activities) {
        const place = activity.placeId ? await details(activity.placeId) : null;
        const point = place?.location ?? activity.location;
        if (isValidCoordinate(point)) points.push(point);
        else kilometersPartial = true;
        if (activity.placeId && !place) kilometersPartial = true;
      }
      const center = centroid(points);
      if (center) {
        total += haversineKm(origin, center);
        computed = true;
      } else kilometersPartial = true;
    }
  }

  check();

  return {
    tripCount: trips.length,
    countriesCount: codes.size,
    countryCodes: [...codes],
    kilometers: computed ? Math.round(total) : null,
    unresolvedDestinationsCount,
    resolutionFailures,
    kilometersPartial,
  };
}
