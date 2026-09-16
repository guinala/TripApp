import type { LatLng, PlaceDetails, PlaceViewport } from "@/types/place";
export type { LatLng } from "@/types/place";

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export function isValidCoordinate(
  point: LatLng | null | undefined,
): point is LatLng {
  return (
    !!point &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    Math.abs(point.lat) <= 90 &&
    Math.abs(point.lng) <= 180
  );
}

const wrap = (lng: number) => ((((lng + 180) % 360) + 360) % 360) - 180;

function region(
  south: number,
  north: number,
  west: number,
  width: number,
  padding: number,
): MapRegion {
  return {
    latitude: (south + north) / 2,
    longitude: wrap(west + width / 2),
    latitudeDelta: Math.min(180, Math.max(0.02, (north - south) * padding)),
    longitudeDelta: Math.min(360, Math.max(0.02, width * padding)),
  };
}

export function regionFromViewport(
  viewport: PlaceViewport | null | undefined,
): MapRegion | null {
  if (
    !viewport ||
    !isValidCoordinate(viewport.low) ||
    !isValidCoordinate(viewport.high) ||
    viewport.low.lat > viewport.high.lat
  ) {
    return null;
  }
  const rawWidth = viewport.high.lng - viewport.low.lng;
  return region(
    viewport.low.lat,
    viewport.high.lat,
    viewport.low.lng,
    rawWidth < 0 ? rawWidth + 360 : rawWidth,
    1.1,
  );
}

export function regionForPoints(
  points: LatLng[],
  padding = 1.4,
): MapRegion | null {
  const valid = points.filter(isValidCoordinate);
  if (!valid.length) return null;
  const longitudes = valid.map((p) => (p.lng + 360) % 360).sort((a, b) =>
    a - b
  );
  let largestGap = -1,
    start = longitudes[0];
  for (let i = 0; i < longitudes.length; i++) {
    const next = i === longitudes.length - 1
      ? longitudes[0] + 360
      : longitudes[i + 1];
    if (next - longitudes[i] > largestGap) {
      largestGap = next - longitudes[i];
      start = next % 360;
    }
  }
  return region(
    Math.min(...valid.map((p) => p.lat)),
    Math.max(...valid.map((p) => p.lat)),
    start,
    360 - largestGap,
    padding,
  );
}

export function itineraryRegion(
  points: LatLng[],
  destination: PlaceDetails | null,
): MapRegion | null {
  return (
    regionForPoints(points) ??
      regionFromViewport(destination?.viewport) ??
      (destination?.location ? regionForPoints([destination.location]) : null)
  );
}
