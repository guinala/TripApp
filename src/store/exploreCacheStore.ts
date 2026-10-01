import { create } from "zustand";
import {
    placeSessionEnabled,
    placeSessionVersion,
    subscribePlaceSession,
} from "@/services/place-session";
import { PlacesError } from "@/services/places";

export type ExploreCacheOptions = {
    signal?: AbortSignal;
    bypassCache?: boolean;
};

type Group = "area" | "feed" | "browse" | "content" | "photo";

type Entry = {
    group: Group;
    value: unknown;
};

type Pending = {
    group: Group;
    controller: AbortController;
    promise: Promise<unknown>;
};

type CacheState = {
    entries: Map<string, Entry>;
    discoveryRevision: number;
};

const MAX_ENTRIES = 128;

export const useExploreCacheStore = create<CacheState>(() => ({
    entries: new Map(),
    discoveryRevision: 0,
}));

const pending = new Map<string, Pending>();

function cacheKey(
    group: Group,
    parts: readonly unknown[],
    epoch = placeSessionVersion(),
) {
    return JSON.stringify([epoch, group, ...parts]);
}

function put(key: string, group: Group, value: unknown) {
    useExploreCacheStore.setState((state) => {
        const entries = new Map(state.entries);

        entries.delete(key);
        entries.set(key, { group, value });

        while (entries.size > MAX_ENTRIES) {
            const oldest = entries.keys().next().value;

            if (oldest === undefined) break;
            entries.delete(oldest);
        }

        return { entries };
    });
}

/**
 * Permite aprovechar datos obtenidos por otra operación.
 * Por ejemplo: Discover ya devuelve la zona resuelta.
 */
export function seedExploreCache<T>(
    group: Group,
    parts: readonly unknown[],
    value: T,
    expectedEpoch: number,
) {
    if (
        expectedEpoch !== placeSessionVersion() ||
        !placeSessionEnabled()
    ) {
        return;
    }

    put(cacheKey(group, parts, expectedEpoch), group, value);
}

/**
 * Cancelar un consumidor no cancela la petición compartida.
 * Otra pantalla puede seguir necesitando su resultado.
 */
function consume<T>(
    promise: Promise<T>,
    signal?: AbortSignal,
): Promise<T> {
    if (!signal) return promise;

    if (signal.aborted) {
        return Promise.reject(new PlacesError("CANCELLED"));
    }

    return new Promise<T>((resolve, reject) => {
        const onAbort = () => {
            signal.removeEventListener("abort", onAbort);
            reject(new PlacesError("CANCELLED"));
        };

        signal.addEventListener("abort", onAbort, { once: true });

        promise.then(
            (value) => {
                signal.removeEventListener("abort", onAbort);

                if (signal.aborted) {
                    reject(new PlacesError("CANCELLED"));
                } else {
                    resolve(value);
                }
            },
            (error: unknown) => {
                signal.removeEventListener("abort", onAbort);
                reject(error);
            },
        );
    });
}

export function cachedExploreRequest<T>(
    group: Group,
    parts: readonly unknown[],
    load: (signal: AbortSignal) => Promise<T>,
    options: ExploreCacheOptions = {},
): Promise<T> {
    if (options.signal?.aborted || !placeSessionEnabled()) {
        return Promise.reject(new PlacesError("CANCELLED"));
    }

    const epoch = placeSessionVersion();
    const key = cacheKey(group, parts, epoch);

    const existing = pending.get(key);

    if (existing) {
        return consume(existing.promise as Promise<T>, options.signal);
    }

    const cached = useExploreCacheStore.getState().entries.get(key);

    if (cached && !options.bypassCache) {
        return consume(Promise.resolve(cached.value as T), options.signal);
    }

    const controller = new AbortController();

    const promise = Promise.resolve()
        .then(() => {
            if (controller.signal.aborted) {
                throw new PlacesError("CANCELLED");
            }

            return load(controller.signal);
        })
        .then((value) => {
            if (
                controller.signal.aborted ||
                epoch !== placeSessionVersion() ||
                !placeSessionEnabled()
            ) {
                throw new PlacesError("CANCELLED");
            }

            put(key, group, value);
            return value;
        });

    const request: Pending = { group, controller, promise };
    pending.set(key, request);

    const remove = () => {
        if (pending.get(key) === request) {
            pending.delete(key);
        }
    };

    void promise.then(remove, remove);

    return consume(promise, options.signal);
}

export function invalidateExploreDiscovery() {
    for (const [key, request] of pending) {
        if (request.group === "area" || request.group === "feed") {
            pending.delete(key);
            request.controller.abort();
        }
    }

    useExploreCacheStore.setState((state) => ({
        entries: new Map(
            [...state.entries].filter(
                ([, entry]) => entry.group !== "area" && entry.group !== "feed",
            ),
        ),
        discoveryRevision: state.discoveryRevision + 1,
    }));
}

subscribePlaceSession(() => {
    for (const request of pending.values()) {
        request.controller.abort();
    }

    pending.clear();

    useExploreCacheStore.setState({
        entries: new Map(),
    });
});
