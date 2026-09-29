import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
    discoverPlaces,
    isPlacesCancelled,
    PlacesError,
} from "@/services/places";
import {
    placeSessionEnabled,
    placeSessionVersion,
    subscribePlaceSession,
} from "@/services/place-session";
import type { ExploreArea, ResolvedExploreArea } from "@/types/explore";
import type { PlaceLanguage } from "@/types/place";

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

    const key = JSON.stringify([
        languageCode,
        area ?? null,
        fallbackCountryCode ?? null,
        timeZone ?? "UTC",
        epoch,
        attempt,
    ]);

    const active = enabled && placeSessionEnabled();

    useEffect(() => {
        if (!active) return;

        const controller = new AbortController();

        discoverPlaces(
            {
                mode: "cities",
                resolveOnly: true,
                languageCode,
                ...(area ? { area } : {}),
                ...(fallbackCountryCode ? { fallbackCountryCode } : {}),
                ...(timeZone ? { timeZone } : {}),
            },
            { signal: controller.signal },
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
