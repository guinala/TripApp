import {
    browsePlaces,
    discoverPlaces,
    getPlaceContent,
    getPlacePhoto,
} from "@/services/places";
import { placeSessionVersion } from "@/services/place-session";
import {
    cachedExploreRequest,
    type ExploreCacheOptions,
    seedExploreCache,
    useExploreCacheStore,
} from "@/store/exploreCacheStore";
import type { BrowseSpec, DiscoveryResponse } from "@/types/explore";
import type { PlaceLanguage } from "@/types/place";

type DiscoverInput = Parameters<typeof discoverPlaces>[0];

export function cachedDiscoverPlaces(
    request: DiscoverInput,
    options: ExploreCacheOptions = {},
): Promise<DiscoveryResponse> {
    const revision = useExploreCacheStore.getState().discoveryRevision;
    const epoch = placeSessionVersion();

    const scope = [
        request.languageCode,
        request.area ?? null,
        request.fallbackCountryCode ?? null,
        request.timeZone ?? "UTC",
        revision,
    ];

    if (request.resolveOnly) {
        return cachedExploreRequest(
            "area",
            scope,
            (signal) => discoverPlaces(request, { signal }),
            options,
        );
    }

    return cachedExploreRequest(
        "feed",
        [request.mode, ...scope],
        async (signal) => {
            const data = await discoverPlaces(request, { signal });

            if (
                !signal.aborted &&
                revision === useExploreCacheStore.getState().discoveryRevision
            ) {
                seedExploreCache(
                    "area",
                    scope,
                    { ...data, places: [] },
                    epoch,
                );
            }

            return data;
        },
        options,
    );
}

export function cachedBrowsePlaces(
    search: BrowseSpec,
    languageCode: PlaceLanguage,
    options: ExploreCacheOptions = {},
) {
    return cachedExploreRequest(
        "browse",
        [languageCode, search],
        (signal) => browsePlaces(search, languageCode, { signal }),
        options,
    );
}

export function cachedPlaceContent(
    placeId: string,
    languageCode: PlaceLanguage,
    options: ExploreCacheOptions = {},
) {
    return cachedExploreRequest(
        "content",
        [placeId, languageCode],
        (signal) => getPlaceContent(placeId, languageCode, { signal }),
        options,
    );
}

export function cachedPlacePhoto(
    placeId: string,
    size: "card" | "hero",
    languageCode: PlaceLanguage,
    options: ExploreCacheOptions = {},
) {
    return cachedExploreRequest(
        "photo",
        [placeId, size, languageCode],
        (signal) => getPlacePhoto(placeId, size, languageCode, { signal }),
        options,
    );
}
