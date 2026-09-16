import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import type { PlaceDetails, PlaceLanguage } from "@/types/place";
import {
  forgetPlace,
  placeSessionEnabled,
  placeSessionVersion,
  readPlace,
  resolvePlace,
  subscribePlaceSession,
} from "@/services/place-session";
import { PlacesError } from "@/services/places";

export type PlaceResolution = {
  status: "unresolved" | "loading" | "ready" | "error";
  place: PlaceDetails | null;
  error: PlacesError | null;
};

const idle: PlaceResolution = {
  status: "unresolved",
  place: null,
  error: null,
};

export function usePlaceLanguage(): PlaceLanguage {
  const { i18n } = useTranslation();
  return i18n.language.startsWith("en") ? "en" : "es";
}

export function usePlaceDetails(
  placeId: string | null,
  language: PlaceLanguage,
  enabled = true,
) {
  const epoch = useSyncExternalStore(
    subscribePlaceSession,
    placeSessionVersion,
    placeSessionVersion,
  );

  const [attempt, setAttempt] = useState(0);

  const identity = JSON.stringify([placeId, language, enabled, epoch, attempt]);

  const [state, setState] = useState<{ key: string; value: PlaceResolution }>({
    key: "",
    value: idle,
  });

  const available = enabled && placeSessionEnabled() && !!placeId;

  useEffect(() => {
    if (!available || !placeId) return;

    let cancelled = false;

    resolvePlace(placeId, language)
      .then((place) => {
        if (!cancelled) {
          setState({
            key: identity,
            value: { status: "ready", place, error: null },
          });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            key: identity,
            value: {
              status: "error",
              place: null,
              error: error instanceof PlacesError
                ? error
                : new PlacesError("NETWORK_ERROR", true),
            },
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [available, identity, language, placeId]);

  const retry = useCallback(() => {
    if (placeId) forgetPlace(placeId, language);
    setAttempt((n) => n + 1);
  }, [placeId, language]);

  const cached = available && placeId
    ? readPlace(placeId, language)
    : undefined;

  const current: PlaceResolution = !available
    ? idle
    : state.key === identity
    ? state.value
    : cached
    ? { status: "ready", place: cached, error: null }
    : { status: "loading", place: null, error: null };
  return { ...current, retry };
}
