import { PlaceLanguage } from "@/types/place";
import { getPlaceDetails, PlaceDetails, PlacesError } from "./places";

let epoch = 0;
let owner: string | null = null;
let foreground = true;
let active = 0;

const listeners = new Set<() => void>();
const cache = new Map<string, PlaceDetails>();
const pending = new Map<string, Promise<PlaceDetails>>();
const controllers = new Set<AbortController>();
const queue: (() => void)[] = [];
const key = (id: string, language: PlaceLanguage) =>
    JSON.stringify([id, language]);

export const placeSessionVersion = () => epoch;
export const placeSessionEnabled = () => foreground && owner !== null;
export function subscribePlaceSession(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function clearPlaceSession() {
    epoch += 1;
    cache.clear();
    pending.clear();
    controllers.forEach((c) => c.abort());
    listeners.forEach((fn) => fn());
}

export function setPlaceOwner(userId: string | null) {
    if (owner === userId) return;
    owner = userId;
    clearPlaceSession();
}

export function setPlaceForeground(value: boolean) {
    if (foreground === value) return;
    foreground = value;
    clearPlaceSession();
}

export function readPlace(id: string, language: PlaceLanguage) {
    return cache.get(key(id, language));
}

export function rememberPlace(
    place: PlaceDetails,
    language: PlaceLanguage,
    expectedEpoch = epoch,
) {
    if (expectedEpoch !== epoch || !placeSessionEnabled()) return;
    const k = key(place.placeId, language);
    cache.delete(k);
    cache.set(k, place);
    if (cache.size > 100) cache.delete(cache.keys().next().value!);
}

export function forgetPlace(id: string, language: PlaceLanguage) {
    cache.delete(key(id, language));
}

function pump() {
    while (active < 3 && queue.length) queue.shift()!();
}

function limited<T>(work: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        queue.push(() => {
            active += 1;
            work()
                .then(resolve, reject)
                .finally(() => {
                    active -= 1;
                    pump();
                });
        });
        pump();
    });
}

export function resolvePlace(
    id: string,
    language: PlaceLanguage,
): Promise<PlaceDetails> {
    if (!placeSessionEnabled()) {
        return Promise.reject(new PlacesError("CANCELLED"));
    }
    const k = key(id, language);
    const existing = cache.get(k);
    if (existing) return Promise.resolve(existing);
    const request = pending.get(k);
    if (request) return request;
    const started = epoch;
    const promise = limited(async () => {
        if (started !== epoch) throw new PlacesError("CANCELLED");
        const controller = new AbortController();
        controllers.add(controller);
        try {
            const place = await getPlaceDetails(id, {
                languageCode: language,
                signal: controller.signal,
            });
            if (started !== epoch) throw new PlacesError("CANCELLED");
            rememberPlace(place, language, started);
            return place;
        } finally {
            controllers.delete(controller);
        }
    });
    pending.set(k, promise);
    const remove = () => {
        if (pending.get(k) === promise) pending.delete(k);
    };
    void promise.then(remove, remove);
    return promise;
}
