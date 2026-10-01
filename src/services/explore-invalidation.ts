import { useTripStore } from "@/store/tripStore";
import { useItineraryRefreshStore } from "@/store/itineraryRefreshStore";
import { invalidateExploreDiscovery } from "@/store/exploreCacheStore";
import type { Trip } from "@/types/trip";

function discoveryFingerprint(trips: Trip[]) {
    return JSON.stringify(
        trips
            .map((trip) => ({
                id: trip.id,
                userId: trip.userId,
                destination: trip.destination,
                destinationPlaceId: trip.destinationPlaceId,
                startDate: trip.startDate,
                endDate: trip.endDate,
                status: trip.status,
            }))
            .sort((a, b) => a.id.localeCompare(b.id)),
    );
}

useTripStore.subscribe((current, previous) => {
    if (current.trips === previous.trips) return;

    if (
        discoveryFingerprint(current.trips) !==
            discoveryFingerprint(previous.trips)
    ) {
        invalidateExploreDiscovery();
    }
});

useItineraryRefreshStore.subscribe((current, previous) => {
    if (current.revisions !== previous.revisions) {
        invalidateExploreDiscovery();
    }
});
