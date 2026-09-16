import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { usePlaceLanguage } from "./use-place-details";
import { listEditorialDestinations } from "@/services/editorial-destinations";
import type { EditorialDestination } from "@/types/destination";

export function useEditorialDestinations() {
    const owner = useAuthStore((s) => s.user?.id),
        language = usePlaceLanguage();
    const [attempt, setAttempt] = useState(0);
    const key = JSON.stringify([owner, language, attempt]);
    const [result, setResult] = useState<
        {
            key: string;
            data: EditorialDestination[];
            error: string | null;
        } | null
    >(null);
    useFocusEffect(
        useCallback(() => {
            if (!owner) return;
            let cancelled = false;
            listEditorialDestinations(language)
                .then((data) => {
                    if (!cancelled) setResult({ key, data, error: null });
                })
                .catch((e) => {
                    if (!cancelled) {
                        setResult({
                            key,
                            data: [],
                            error: e instanceof Error ? e.message : "load",
                        });
                    }
                });
            return () => {
                cancelled = true;
            };
        }, [key, owner, language]),
    );
    const current = result?.key === key ? result : null;
    return {
        destinations: current?.data ?? [],
        loading: !!owner && !current,
        error: current?.error ?? null,
        retry: () => setAttempt((a) => a + 1),
    };
}
