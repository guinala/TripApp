import { matchesPhotoGeography, PhotoScope } from "@/utils/photo-geography";
import { createTtlCache } from "@/utils/ttlCache";

const BASE_URL = "https://api.unsplash.com/search/photos";
const ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
const CACHE_TTL_MS = 60 * 60 * 1000;

export type UnsplashPhoto = {
  id: string;
  thumbUrl: string;
  smallUrl: string;
  regularUrl: string;
  alt: string | null;
  authorName: string;
  authorLink: string;
  photoLink: string;
  downloadLocation: string;
};

export type UnsplashRequestOptions = {
  signal?: AbortSignal;
  bypassCache?: boolean;
};

type SharedRequest = {
  controller: AbortController;
  promise: Promise<UnsplashPhoto[]>;
  subscribers: number;
  settled: boolean;
};

export class UnsplashTimeoutError extends Error {
  constructor() {
    super("UNSPLASH_TIMEOUT");
    this.name = "UnsplashTimeoutError";
  }
}

const cache = createTtlCache<UnsplashPhoto[]>(CACHE_TTL_MS);
const verifiedCache = createTtlCache<UnsplashPhoto | null>(
  CACHE_TTL_MS,
);
const pending = new Map<string, SharedRequest>();

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const requiredText = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const httpsUrl = (value: unknown) => {
  const url = requiredText(value);
  if (!url) return null;
  try {
    return new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
};

function cancelled(): Error {
  const error = new Error("CANCELLED");
  error.name = "AbortError";
  return error;
}

function mapResponse(value: unknown): UnsplashPhoto[] {
  if (!isObject(value) || !Array.isArray(value.results)) {
    throw new Error("Respuesta no válida de Unsplash");
  }
  const photos: UnsplashPhoto[] = [];
  for (const item of value.results) {
    if (!isObject(item) || !isObject(item.urls) || !isObject(item.user)) {
      throw new Error("Respuesta no válida de Unsplash");
    }
    const userLinks = item.user.links;
    const links = item.links;
    if (!isObject(userLinks) || !isObject(links)) {
      throw new Error("Respuesta no válida de Unsplash");
    }
    const id = requiredText(item.id);
    const authorName = requiredText(item.user.name);
    const authorLink = httpsUrl(userLinks.html);
    const photoLink = httpsUrl(links.html);
    const downloadLocation = httpsUrl(links.download_location);
    if (!id || !authorName || !authorLink || !photoLink || !downloadLocation) {
      throw new Error("Respuesta no válida de Unsplash");
    }
    const thumbUrl = httpsUrl(item.urls.thumb);
    const smallUrl = httpsUrl(item.urls.small);
    const regularUrl = httpsUrl(item.urls.regular);
    if (!thumbUrl || !smallUrl || !regularUrl) continue;
    if (
      item.alt_description !== null && typeof item.alt_description !== "string"
    ) {
      throw new Error("Respuesta no válida de Unsplash");
    }
    photos.push({
      id,
      thumbUrl,
      smallUrl,
      regularUrl,
      alt: item.alt_description,
      authorName,
      authorLink,
      photoLink,
      downloadLocation,
    });
  }
  return photos;
}

async function requestPhotos(
  query: string,
  perPage: number,
  signal: AbortSignal,
): Promise<UnsplashPhoto[]> {
  if (!ACCESS_KEY) {
    throw new Error("Falta EXPO_PUBLIC_UNSPLASH_ACCESS_KEY en el entorno");
  }
  const params = new URLSearchParams({
    query,
    per_page: String(perPage),
    orientation: "landscape",
    content_filter: "high",
  });
  const response = await fetch(`${BASE_URL}?${params.toString()}`, {
    headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
    signal,
  });
  if (!response.ok) throw new Error(`Unsplash respondió ${response.status}`);
  return mapResponse(await response.json());
}

function sharedRequest(
  key: string,
  query: string,
  perPage: number,
): SharedRequest {
  const existing = pending.get(key);

  if (existing && !existing.controller.signal.aborted) {
    return existing;
  }

  const controller = new AbortController();
  let timedOut = false;

  const shared: SharedRequest = {
    controller,
    subscribers: 0,
    settled: false,
    promise: Promise.resolve([]),
  };

  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 5_000);

  shared.promise = requestPhotos(query, perPage, controller.signal)
    .then((photos) => {
      cache.set(key, photos);
      return photos;
    })
    .catch((error: unknown) => {
      if (timedOut) {
        throw new UnsplashTimeoutError();
      }

      throw error;
    })
    .finally(() => {
      clearTimeout(timeout);
      shared.settled = true;

      if (pending.get(key) === shared) {
        pending.delete(key);
      }
    });

  pending.set(key, shared);
  return shared;
}

function subscribe(
  shared: SharedRequest,
  signal?: AbortSignal,
): Promise<UnsplashPhoto[]> {
  if (signal?.aborted) return Promise.reject(cancelled());
  shared.subscribers += 1;
  let onAbort: (() => void) | undefined;
  const aborted = signal
    ? new Promise<UnsplashPhoto[]>((_, reject) => {
      onAbort = () => reject(cancelled());
      signal.addEventListener("abort", onAbort, { once: true });
    })
    : null;
  return (aborted ? Promise.race([shared.promise, aborted]) : shared.promise)
    .finally(() => {
      if (signal && onAbort) signal.removeEventListener("abort", onAbort);
      shared.subscribers -= 1;
      if (shared.subscribers === 0 && !shared.settled) {
        shared.controller.abort();
      }
    });
}

export async function searchPhotos(
  query: string,
  perPage = 5,
  options: UnsplashRequestOptions = {},
): Promise<UnsplashPhoto[]> {
  if (options.signal?.aborted) throw cancelled();
  const clean = query.trim();
  if (!clean) return [];
  const key = `${clean.toLowerCase()}|${perPage}`;
  if (!options.bypassCache) {
    const cached = cache.get(key);
    if (cached) return cached;
  }
  return subscribe(sharedRequest(key, clean, perPage), options.signal);
}

export async function getCoverPhoto(
  query: string,
  options: UnsplashRequestOptions = {},
): Promise<UnsplashPhoto | null> {
  return (await searchPhotos(query, 1, options))[0] ?? null;
}

export async function getVerifiedCoverPhoto(
  query: string,
  scope: PhotoScope,
  options: UnsplashRequestOptions = {},
): Promise<UnsplashPhoto | null> {
  if (options.signal?.aborted) throw cancelled();
  if (scope.kind === "other" || !scope.countryNames.length) {
    return null;
  }

  const key = JSON.stringify([query.trim(), scope]);

  if (!options.bypassCache) {
    const cached = verifiedCache.get(key);
    if (cached !== undefined) return cached;
  }

  const candidates = await searchPhotos(query, 3, options);

  if (!candidates.length) {
    verifiedCache.set(key, null);
    return null;
  }

  if (options.signal?.aborted) throw cancelled();

  const controller = new AbortController();
  let timedOut = false;

  const onAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onAbort, {
    once: true,
  });

  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 5_000);

  try {
    for (const candidate of candidates) {
      if (options.signal?.aborted) throw cancelled();

      const response = await fetch(
        `https://api.unsplash.com/photos/${encodeURIComponent(candidate.id)}`,
        {
          headers: {
            Authorization: `Client-ID ${ACCESS_KEY}`,
          },
          signal: controller.signal,
        },
      );

      if (response.status === 404) continue;

      if (!response.ok) {
        throw new Error(`Unsplash respondió ${response.status}`);
      }

      const details: unknown = await response.json();

      if (
        isObject(details) &&
        details.id === candidate.id &&
        matchesPhotoGeography(details, scope)
      ) {
        if (options.signal?.aborted) throw cancelled();

        verifiedCache.set(key, candidate);
        return candidate;
      }
    }

    verifiedCache.set(key, null);
    return null;
  } catch (error) {
    if (options.signal?.aborted) throw cancelled();
    if (timedOut) throw new UnsplashTimeoutError();
    throw error;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", onAbort);
  }
}
