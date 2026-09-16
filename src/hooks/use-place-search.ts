import {
    useCallback,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
} from "react";
import {
    isPlacesCancelled,
    PlacesError,
    searchPlacesByText,
} from "@/services/places";
import {
    placeSessionEnabled,
    placeSessionVersion,
    subscribePlaceSession,
} from "@/services/place-session";
import type { PlaceLanguage, PlaceSummary } from "@/types/place";

export function usePlaceSearch(languageCode: PlaceLanguage) {
    const epoch = useSyncExternalStore(
        subscribePlaceSession,
        placeSessionVersion,
        placeSessionVersion,
    );
    const identity = JSON.stringify([languageCode, epoch]);
    const [resultKey, setResultKey] = useState("");
    const [places, setPlaces] = useState<PlaceSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<PlacesError | null>(null);
    const [searched, setSearched] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const request = useRef<AbortController | null>(null);
    const version = useRef(0);
    const query = useRef("");
    const busy = useRef(false);
    const failedPage = useRef<string | undefined>(undefined);
    const reset = useCallback(() => {
        version.current++;
        request.current?.abort();
        busy.current = false;
        setResultKey(identity);
        query.current = "";
        failedPage.current = undefined;
        setPlaces([]);
        setError(null);
        setLoading(false);
        setSearched(false);
        setNextPageToken(null);
    }, [identity]);
    const cancel = useCallback(() => {
        version.current++;
        request.current?.abort();
        busy.current = false;
        query.current = "";
    }, []);
    useEffect(() => {
        cancel();
        return cancel;
    }, [cancel, identity]);
    const run = async (text: string, pageToken?: string) => {
        if (busy.current || !placeSessionEnabled() || text.trim().length < 3) {
            return;
        }
        const own = ++version.current;
        const controller = new AbortController();
        request.current = controller;
        busy.current = true;
        setResultKey(identity);
        setLoading(true);
        setError(null);
        setSearched(true);
        query.current = text.trim();
        failedPage.current = pageToken;
        try {
            const data = await searchPlacesByText(query.current, {
                languageCode,
                pageToken,
                signal: controller.signal,
            });
            if (own !== version.current) return;
            setPlaces((previous) => [
                ...new Map(
                    [...(pageToken ? previous : []), ...data.places].map((
                        p,
                    ) => [p.placeId, p]),
                ).values(),
            ]);
            setNextPageToken(data.nextPageToken);
        } catch (e) {
            if (own === version.current && !isPlacesCancelled(e)) {
                setError(
                    e instanceof PlacesError
                        ? e
                        : new PlacesError("NETWORK_ERROR"),
                );
            }
        } finally {
            if (own === version.current) {
                busy.current = false;
                setLoading(false);
            }
        }
    };
    const current = resultKey === identity;
    return {
        places: current ? places : [],
        loading: current && loading,
        error: current ? error : null,
        searched: current && searched,
        nextPageToken: current ? nextPageToken : null,
        reset,
        search: (text: string) => {
            reset();
            void run(text);
        },
        loadMore: () => {
            if (nextPageToken) void run(query.current, nextPageToken);
        },
        retry: () => {
            void run(query.current, failedPage.current);
        },
    };
}
