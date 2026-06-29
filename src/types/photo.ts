export type Photo = {
  id: string;
  tripId: string;
  dayId: string | null;
  uri: string; // ruta dentro del bucket trip-photos
  caption: string | null;
  location: { lat: number; lng: number } | null;
  takenAt: string; // ISO
  createdAt: string;
};
