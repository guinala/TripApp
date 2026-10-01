import {
    useCallback,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
} from "react";
import { isPlacesCancelled, PlacesError } from "@/services/places";
import {
    placeSessionEnabled,
    placeSessionVersion,
    subscribePlaceSession,
} from "@/services/place-session";
import type { ExploreArea, ResolvedExploreArea } from "@/types/explore";
import type { PlaceLanguage } from "@/types/place";
import { useExploreCacheStore } from "@/store/exploreCacheStore";
import { cachedDiscoverPlaces } from "@/services/explore-requests";

type AreaResult = {
    key: string;
    area: ResolvedExploreArea | null;
    partial: boolean;
    error: PlacesError | null;
};

export function useExploreArea({
    languageCode,
    area,
    fallbackCountryCode,
    timeZone,
    enabled,
}: {
    languageCode: PlaceLanguage;
    area?: ExploreArea;
    fallbackCountryCode?: string;
    timeZone?: string;
    enabled: boolean;
}) {
    const epoch = useSyncExternalStore(
        subscribePlaceSession,
        placeSessionVersion,
        placeSessionVersion,
    );

    const [attempt, setAttempt] = useState(0);
    const [result, setResult] = useState<AreaResult | null>(null);

    const active = enabled && placeSessionEnabled();
    const discoveryRevision = useExploreCacheStore(
        (state) => state.discoveryRevision,
    );

    const lastAttempt = useRef(0);

    const key = JSON.stringify([
        languageCode,
        area ?? null,
        fallbackCountryCode ?? null,
        timeZone ?? "UTC",
        epoch,
        attempt,
        discoveryRevision,
    ]);

    useEffect(() => {
        if (!active) return;

        const bypassCache = attempt !== lastAttempt.current;
        lastAttempt.current = attempt;
        const controller = new AbortController();

        cachedDiscoverPlaces(
            {
                mode: "cities",
                resolveOnly: true,
                languageCode,
                ...(area ? { area } : {}),
                ...(fallbackCountryCode ? { fallbackCountryCode } : {}),
                ...(timeZone ? { timeZone } : {}),
            },
            {
                signal: controller.signal,
                bypassCache,
            },
        )
            .then((data) => {
                if (controller.signal.aborted) return;

                setResult({
                    key,
                    area: data.area,
                    partial: data.partial,
                    error: null,
                });
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted || isPlacesCancelled(error)) {
                    return;
                }

                setResult({
                    key,
                    area: null,
                    partial: false,
                    error: error instanceof PlacesError
                        ? error
                        : new PlacesError("NETWORK_ERROR", true),
                });
            });

        return () => controller.abort();
    }, [
        active,
        key,
        languageCode,
        area,
        fallbackCountryCode,
        timeZone,
        attempt,
    ]);

    const current = placeSessionEnabled() && result?.key === key
        ? result
        : null;

    const retry = useCallback(() => {
        setAttempt((value) => value + 1);
    }, []);

    return {
        area: current?.area ?? null,
        partial: current?.partial ?? false,
        error: current?.error ?? null,
        loading: active && !current,
        retry,
    };
}
