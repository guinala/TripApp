export type TripStatus = 'planned' | 'active' | 'completed';

export type TripType = 'city' | 'beach' | 'mountain' | 'road' | 'business';

export type Trip = {
  id: string;
  userId: string;
  title: string;
  destination: string;
  coverImage: string | null;
  startDate: string; // ISO date
  endDate: string;
  budget: number | null;
  currency: string;
  status: TripStatus;
  createdAt: string;
  tripType: TripType | null;
};
