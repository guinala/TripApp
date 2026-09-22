import { useEffect, useState, useSyncExternalStore } from "react";
import {
    isPlacesCancelled,
    PlacesError,
    browsePlaces,
} from "@/services/places";
import {
    placeSessionEnabled,
    placeSessionVersion,
    subscribePlaceSession,
} from "@/services/place-session";
import type {
    InterestCategory,
    LatLng,
    PlaceLanguage,
} from "@/types/place";
import type { ExplorePlace } from '@/types/explore';

export function useNearbyPlaces(
    center: LatLng | null,
    category: InterestCategory,
    languageCode: PlaceLanguage,
    enabled: boolean,
) {
    const epoch = useSyncExternalStore(
        subscribePlaceSession,
        placeSessionVersion,
        placeSessionVersion,
    );
    const [attempt, setAttempt] = useState(0);
    const [result, setResult] = useState<
        {
            key: string;
            places: ExplorePlace[];
            error: PlacesError | null;
        } | null
    >(null);
    const lat = center?.lat,
        lng = center?.lng;
    const key = enabled && lat != null && lng != null && placeSessionEnabled()
        ? JSON.stringify([lat, lng, category, languageCode, epoch, attempt])
        : null;
    useEffect(() => {
        if (!key || lat == null || lng == null) return;
        const controller = new AbortController();
        browsePlaces(
            { kind: 'nearby', center: { lat, lng }, category },
            languageCode,
            { signal: controller.signal },
        )
            .then(({ places }) => {
                if (!controller.signal.aborted) {
                    setResult({ key, places, error: null });
                }
            })
            .catch((e) => {
                if (!controller.signal.aborted && !isPlacesCancelled(e)) {
                    setResult({
                        key,
                        places: [],
                        error: e instanceof PlacesError
                            ? e
                            : new PlacesError("NETWORK_ERROR"),
                    });
                }
            });
        return () => controller.abort();
    }, [key, lat, lng, category, languageCode]);
    const current = result?.key === key ? result : null;
    return {
        places: current?.places ?? [],
        loading: !!key && !current,
        error: current?.error ?? null,
        retry: () => setAttempt((a) => a + 1),
    };
}
