import type { Continent, DestinationType } from "@/types/destination";

export const DESTINATION_TYPE_LABELS: Record<DestinationType, string> = {
  cultural: "destination.types.cultural",
  gastro: "destination.types.gastro",
  aventura: "destination.types.aventura",
  relax: "destination.types.relax",
};

export const CONTINENTS: Continent[] = [
  "Europa",
  "Asia",
  "América",
  "África",
  "Oceanía",
];
