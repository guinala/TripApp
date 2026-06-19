export type ActivityCategory =
  | 'visit'
  | 'restaurant'
  | 'transport'
  | 'hotel'
  | 'entertainment'
  | 'others';

export type Activity = {
  id: string;
  dayId: string;
  title: string;
  time: string | null;
  durationMinutes: number | null;
  location: { lat: number; lng: number } | null;
  address: string | null;
  placeId: string | null;
  notes: string | null;
  category: ActivityCategory;
  estimatedCost: number | null;
  orderIndex: number;
};
