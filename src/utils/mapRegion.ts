export type LatLng = { lat: number; lng: number };

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
