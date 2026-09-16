export type UserStats = {
  tripCount: number;
  countriesCount: number;
  countryCodes: string[];
  kilometers: number | null;
  unresolvedDestinationsCount: number;
  resolutionFailures: number;
  kilometersPartial: boolean;
};
