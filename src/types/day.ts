export type Day = {
  id: string;
  tripId: string;
  dayNumber: number;
  date: string; // 'YYYY-MM-DD'
  title: string | null;
  notes: string | null;
};
