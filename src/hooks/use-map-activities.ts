import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Activity } from "@/types/activity";
import type { PlaceDetails, PlaceLanguage } from "@/types/place";
import {
    forgetPlace,
    placeSessionEnabled,
    placeSessionVersion,
    resolvePlace,
    subscribePlaceSession,
} from "@/services/place-session";
import { isValidCoordinate } from "@/utils/mapRegion";

export function useMapActivities(
    activities: Activity[],
    language: PlaceLanguage,
) {
    const epoch = useSyncExternalStore(
        subscribePlaceSession,
        placeSessionVersion,
        placeSessionVersion,
    );
    const idsKey = JSON.stringify(
        [...new Set(activities.flatMap((a) => (a.placeId ? [a.placeId] : [])))]
            .sort(),
    );
    const [attempt, setAttempt] = useState(0);
    const key = JSON.stringify([idsKey, language, epoch, attempt]);
    const [result, setResult] = useState<
        {
            key: string;
            places: Map<string, PlaceDetails>;
            pending: number;
            failures: number;
        } | null
    >(null);

    useEffect(() => {
        if (!placeSessionEnabled()) return;
        let cancelled = false;
        const ids: string[] = JSON.parse(idsKey);
        const places = new Map<string, PlaceDetails>();
        let pending = ids.length,
            failures = 0;
        const publish = () => {
            if (!cancelled) {
                setResult({ key, places: new Map(places), pending, failures });
            }
        };
        publish();
        ids.forEach((id) => {
            void resolvePlace(id, language)
                .then(
                    (p) => {
                        places.set(id, p);
                    },
                    () => {
                        failures++;
                    },
                )
                .finally(() => {
                    pending--;
                    publish();
                });
        });
        return () => {
            cancelled = true;
        };
    }, [idsKey, key, language]);

    const current = result?.key === key && placeSessionEnabled()
        ? result
        : null;
    const mapActivities = useMemo(
        () =>
            activities.map((a) => {
                const place = a.placeId
                    ? current?.places.get(a.placeId)
                    : undefined;
                return place
                    ? {
                        ...a,
                        location: place.location ?? a.location,
                        address: place.address ?? a.address,
                    }
                    : a;
            }),
        [activities, current],
    );

    return {
        mapActivities,
        missingLocations:
            mapActivities.filter((a) => !isValidCoordinate(a.location)).length,
        loading: placeSessionEnabled() &&
            (current ? current.pending > 0 : JSON.parse(idsKey).length > 0),
        failures: current?.failures ?? 0,
        attributions: [...(current?.places.values() ?? [])].flatMap((p) =>
            p.attributions
        ),
        retry: () => {
            const ids: string[] = JSON.parse(idsKey);
            ids.forEach((id) => forgetPlace(id, language));
            setAttempt((a) => a + 1);
        },
    };
}
