import { useEffect, useState } from "react";
import { getTripById } from "@/services/trips";
import { useTripStore } from "@/store/tripStore";
import { useAuthStore } from "@/store/authStore";

export function useTripRecord(id: string | null) {
    const owner = useAuthStore((s) => s.user?.id);
    const trip =
        useTripStore((s) =>
            s.trips.find((item) => item.id === id && item.userId === owner)
        ) ?? null;
    const [attempt, setAttempt] = useState(0);
    const key = JSON.stringify([id, owner, attempt]);
    const [result, setResult] = useState<
        { key: string; error: string | null } | null
    >(null);

    useEffect(() => {
        if (!id || !owner || trip) return;
        let cancelled = false;
        getTripById(id)
            .then((value) => {
                if (cancelled || useAuthStore.getState().user?.id !== owner) {
                    return;
                }
                if (value) useTripStore.getState().upsertTrip(value);
                setResult({ key, error: null });
            })
            .catch((e) => {
                if (!cancelled) {
                    setResult({
                        key,
                        error: e instanceof Error ? e.message : "load",
                    });
                }
            });
        return () => {
            cancelled = true;
        };
    }, [id, owner, trip, key]);

    return {
        trip,
        loading: !!id && !!owner && !trip && result?.key !== key,
        error: result?.key === key ? result.error : null,
        retry: () => setAttempt((a) => a + 1),
    };
}
