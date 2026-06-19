const PLACES_BASE = 'https://places.googleapis.com/v1';
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY!;

export type PlaceSuggestion = {
  placeId: string;
  mainText: string; // "Templo Senso-ji"
  secondaryText: string; // "Asakusa, Tokio, Japón"
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  address: string | null;
  location: { lat: number; lng: number } | null;
};

export async function autocompletePlaces(
  input: string,
  sessionToken: string,
): Promise<PlaceSuggestion[]> {
  if (!input.trim()) return [];

  const res = await fetch(`${PLACES_BASE}/places:autocomplete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': API_KEY },
    body: JSON.stringify({ input, sessionToken }),
  });

  if (!res.ok) throw new Error(`Autocomplete falló: ${res.status}`);
  const data = await res.json();

  return (data.suggestions ?? [])
    .filter((s: any) => s.placePrediction) // descartamos queryPrediction
    .map((s: any) => ({
      placeId: s.placePrediction.placeId,
      mainText:
        s.placePrediction.structuredFormat?.mainText?.text ?? s.placePrediction.text?.text ?? '',
      secondaryText: s.placePrediction.structuredFormat?.secondaryText?.text ?? '',
    }));
}

export async function getPlaceDetails(
  placeId: string,
  sessionToken: string,
): Promise<PlaceDetails> {
  const res = await fetch(`${PLACES_BASE}/places/${placeId}?sessionToken=${sessionToken}`, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      // Obligatorio en Place Details (New); pedimos solo lo que usamos
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
    },
  });

  if (!res.ok) throw new Error(`Place Details falló: ${res.status}`);
  const data = await res.json();

  return {
    placeId: data.id,
    name: data.displayName?.text ?? '',
    address: data.formattedAddress ?? null,
    location: data.location ? { lat: data.location.latitude, lng: data.location.longitude } : null,
  };
}
