import { useEffect, useState, useSyncExternalStore } from "react";
import { isPlacesCancelled, PlacesError } from "@/services/places";
import { getVerifiedCoverPhoto } from "@/services/unsplash";
import { getCountryDisplayName } from "@/utils/country-names";
import { isCity } from "@/utils/place-kind";
import type { LatLng, PlaceLanguage } from "@/types/place";
import {
  placeSessionEnabled,
  placeSessionVersion,
  subscribePlaceSession,
} from "@/services/place-session";
import type { PlacePhoto } from "@/types/place-photo";
import {
  photoImageFailureAction,
  resolveInitialPhoto,
} from "@/utils/place-photo-fallback";
import { initialPhotoProvider } from "@/utils/place-photo-policy";
import {
  clearPhotoHandoff,
  readPhotoForNavigation,
} from "@/services/place-photo-handoff";
import { cachedPlacePhoto } from "@/services/explore-requests";

type Command = {
  revision: number;
  start: "unsplash" | "google";
  bypassCache: boolean;
  googleLoad: 1 | 2;
};

type PhotoResult = {
  key: string;
  photo: PlacePhoto | null;
  error: PlacesError | Error | null;
  googleLoads: number;
};

const INITIAL_COMMAND: Command = {
  revision: 0,
  start: "unsplash",
  bypassCache: false,
  googleLoad: 1,
};

function unsplashReferral(url: string): string {
  const result = new URL(url);
  result.searchParams.set("utm_source", "tripmate");
  result.searchParams.set("utm_medium", "referral");
  return result.toString();
}

function createLimiter(limit: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  const pump = () => {
    while (active < limit && queue.length) queue.shift()?.();
  };
  return <T>(work: () => Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      queue.push(() => {
        active += 1;
        work().then(resolve, reject).finally(() => {
          active -= 1;
          pump();
        });
      });
      pump();
    });
}

const limitUnsplash = createLimiter(3);
const limitGoogle = createLimiter(2);

export function buildPlacePhotoQuery(
  name: string,
  localityName?: string | null,
  countryName?: string | null,
) {
  return [
    ...new Set(
      [name, localityName, countryName].map((value) => value?.trim()).filter(
        Boolean,
      ),
    ),
  ]
    .join(" ");
}

export function usePlacePhoto({
  placeId,
  name,
  localityName,
  countryName,
  size,
  languageCode,
  enabled,
  types,
  location,
  countryCode,
}: {
  placeId: string;
  name: string;
  localityName?: string | null;
  countryName?: string | null;
  size: "card" | "hero";
  languageCode: PlaceLanguage;
  enabled: boolean;
  types: string[];
  location: LatLng | null;
  countryCode: string | null;
}) {
  const epoch = useSyncExternalStore(
    subscribePlaceSession,
    placeSessionVersion,
    placeSessionVersion,
  );
  const query = buildPlacePhotoQuery(name, localityName, countryName);
  const preferredProvider = initialPhotoProvider(types);
  const photoKind: "country" | "city" | "other" = types.includes("country")
    ? "country"
    : isCity(types)
    ? "city"
    : "other";

  const lat = location?.lat ?? null;
  const lng = location?.lng ?? null;
  const identity = JSON.stringify([
    placeId,
    query,
    size,
    languageCode,
    epoch,
    preferredProvider,
    photoKind,
    countryCode,
    lat,
    lng,
  ]);
  const [commandState, setCommandState] = useState<
    { identity: string; value: Command }
  >({
    identity: "",
    value: INITIAL_COMMAND,
  });
  const command = commandState.identity === identity
    ? commandState.value
    : INITIAL_COMMAND;
  const [result, setResult] = useState<PhotoResult | null>(null);
  const active = enabled && placeSessionEnabled() && !!placeId && !!query;
  const key = active ? JSON.stringify([identity, command]) : "";

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();

    const loadGoogle = () =>
      limitGoogle(() =>
        cachedPlacePhoto(placeId, "hero", languageCode, {
          signal: controller.signal,
          bypassCache: command.bypassCache ||
            command.googleLoad === 2,
        })
      );

    const showGoogle = (
      value: Awaited<ReturnType<typeof loadGoogle>>,
      googleLoad: 1 | 2,
    ) => {
      if (controller.signal.aborted) return;
      setResult({
        key,
        photo: value
          ? { provider: "google", uri: value.uri, credits: value.credits }
          : null,
        error: null,
        googleLoads: googleLoad,
      });
    };
    const run = async () => {
      if (command === INITIAL_COMMAND) {
        const selected = readPhotoForNavigation(
          placeId,
          languageCode,
          size,
        );

        if (
          selected &&
          !(preferredProvider === "google" && selected.provider === "unsplash")
        ) {
          if (controller.signal.aborted) return;

          setResult({
            key,
            photo: selected,
            error: null,
            googleLoads: selected.provider === "google" ? 1 : 0,
          });

          return;
        }
      }

      if (
        preferredProvider === "google" ||
        command.start === "google"
      ) {
        showGoogle(await loadGoogle(), command.googleLoad);
        return;
      }
      const selected = await resolveInitialPhoto(
        () =>
          limitUnsplash(() =>
            getVerifiedCoverPhoto(
              query,
              {
                kind: photoKind,
                name,
                center: lat == null || lng == null ? null : { lat, lng },
                countryNames: [
                  countryName,
                  countryCode,
                  getCountryDisplayName(countryCode ?? undefined, "es"),
                  getCountryDisplayName(countryCode ?? undefined, "en"),
                ].filter((value): value is string => !!value),
              },
              {
                signal: controller.signal,
                bypassCache: command.bypassCache,
              },
            )
          ),
        loadGoogle,
        () => controller.signal.aborted,
      );
      if (controller.signal.aborted) return;
      if (selected.provider === "unsplash") {
        const photo = selected.value;
        const uri = size === "hero" ? photo.regularUrl : photo.smallUrl;
        setResult({
          key,
          photo: {
            provider: "unsplash",
            uri,
            photoId: photo.id,
            smallUri: photo.smallUrl,
            heroUri: photo.regularUrl,
            credits: [
              {
                name: photo.authorName,
                uri: unsplashReferral(photo.authorLink),
              },
              {
                name: "Unsplash",
                uri:
                  "https://unsplash.com/?utm_source=tripmate&utm_medium=referral",
              },
            ],
          },
          error: null,
          googleLoads: 0,
        });
        return;
      }
      showGoogle(selected.value, 1);
    };
    run().catch((error: unknown) => {
      if (controller.signal.aborted || isPlacesCancelled(error)) return;
      setResult({
        key,
        photo: null,
        error: error instanceof PlacesError || error instanceof Error
          ? error
          : new Error("PHOTO_ERROR"),
        googleLoads: command.googleLoad,
      });
    });
    return () => controller.abort();
  }, [
    active,
    command,
    key,
    languageCode,
    placeId,
    query,
    size,
    preferredProvider,
    photoKind,
    countryCode,
    countryName,
    name,
    lat,
    lng,
  ]);

  const retry = () => {
    clearPhotoHandoff(placeId);
    setCommandState((previous) => {
      const value = previous.identity === identity
        ? previous.value
        : INITIAL_COMMAND;
      return {
        identity,
        value: {
          revision: value.revision + 1,
          start: "unsplash",
          bypassCache: true,
          googleLoad: 1,
        },
      };
    });
  };

  const reportImageError = () => {
    if (result?.key !== key || !result.photo) return;
    clearPhotoHandoff(placeId);
    const action = photoImageFailureAction(
      result.photo.provider,
      result.googleLoads,
    );
    if (action.kind === "request_google") {
      setCommandState((previous) => {
        const value = previous.identity === identity
          ? previous.value
          : INITIAL_COMMAND;
        return {
          identity,
          value: {
            revision: value.revision + 1,
            start: "google",
            bypassCache: false,
            googleLoad: action.load,
          },
        };
      });
      return;
    }
    setResult({
      key,
      photo: null,
      error: new Error("PHOTO_RENDER_ERROR"),
      googleLoads: 2,
    });
  };

  if (!active) {
    return {
      photo: null,
      loading: false,
      error: null,
      retry,
      reportImageError,
    };
  }
  if (result?.key !== key) {
    return { photo: null, loading: true, error: null, retry, reportImageError };
  }
  return {
    photo: result.photo,
    loading: false,
    error: result.error,
    retry,
    reportImageError,
  };
}
