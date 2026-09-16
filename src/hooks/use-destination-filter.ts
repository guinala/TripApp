import { useMemo } from "react";
import type { Continent, EditorialDestination } from "@/types/destination";

export function useDestinationFilter(
  destinations: EditorialDestination[],
  continent: Continent | null,
) {
  return useMemo(() => {
    const filtered = destinations.filter((d) =>
      !continent || d.continent === continent
    );
    const featured = filtered.find((d) => d.featured) ?? null;
    return { featured, rest: filtered.filter((d) => d.id !== featured?.id) };
  }, [destinations, continent]);
}
