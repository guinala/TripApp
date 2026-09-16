export type Continent = "Europa" | "Asia" | "África" | "América" | "Oceanía";

export type DestinationType = "cultural" | "gastro" | "aventura" | "relax";

export type EditorialDestination = {
  id: string;
  placeId: string | null;
  name: string;
  country: string;
  countryCode: string | null;
  continent: Continent;
  types: DestinationType[];
  description: string;
  descriptionLanguage: "es" | "en";
  coverQuery: string;
  featured: boolean;
  sortOrder: number;
};
