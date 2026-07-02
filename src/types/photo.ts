export type Photo = {
  id: string;
  tripId: string;
  dayId: string | null;
  uri: string;
  caption: string | null;
  location: { lat: number; lng: number } | null;
  takenAt: string; // ISO
  createdAt: string;
};
