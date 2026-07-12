import { useMemo } from 'react';
import { DESTINATIONS } from '@/constants/destinations';
import type { Continent, Destination } from '@/types/destination';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export type DestinationFilterResult = {
  featured: Destination | null;
  rest: Destination[];
};

export function useDestinationFilter(
  query: string,
  continent: Continent | null,
): DestinationFilterResult {
  return useMemo(() => {
    const q = normalize(query.trim());

    let filtered = DESTINATIONS;
    if (continent) {
      filtered = filtered.filter((d) => d.continent === continent);
    }
    if (q.length > 0) {
      filtered = filtered.filter(
        (d) =>
          normalize(d.name).includes(q) ||
          normalize(d.country).includes(q) ||
          normalize(d.description).includes(q),
      );
    }

    if (q.length > 0) {
      return { featured: null, rest: filtered };
    }

    const featured =
      filtered.find((d) => d.featured) ??
      (filtered.length > 0
        ? filtered.reduce((best, d) => (d.rating > best.rating ? d : best), filtered[0])
        : null);

    return {
      featured,
      rest: featured ? filtered.filter((d) => d.id !== featured.id) : filtered,
    };
  }, [query, continent]);
}
