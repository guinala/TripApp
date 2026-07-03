export type Continent = 'Europa' | 'Asia' | 'África' | 'América' | 'Oceanía';

export type DestinationType = 'cultural' | 'gastro' | 'aventura' | 'relax';

export type PriceRange = 'low' | 'mid' | 'high';

export type DestinationHighlight = {
  name: string;
  tag: string;
  query: string;
};

export type Destination = {
  id: string;
  name: string;
  country: string;
  continent: Continent;
  types: DestinationType[];
  priceRange: PriceRange;
  rating: number;
  description: string;
  coverQuery: string;
  coordinates: { lat: number; lng: number };
  language: { code: string; label: string };
  highlights: DestinationHighlight[];
  featured?: boolean;
};
