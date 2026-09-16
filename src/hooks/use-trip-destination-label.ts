import type { Trip } from "@/types/trip";
import { usePlaceDetails, usePlaceLanguage } from "@/hooks/use-place-details";
export function useTripDestinationLabel(trip: Trip | null, enabled = true) {
    const resolution = usePlaceDetails(
        trip?.destinationPlaceId ?? null,
        usePlaceLanguage(),
        enabled,
    );
    return {
        label: resolution.place
            ? [resolution.place.name, resolution.place.countryName].filter(
                Boolean,
            ).join(", ")
            : (trip?.destination ?? ""),
        place: resolution.place,
    };
}
