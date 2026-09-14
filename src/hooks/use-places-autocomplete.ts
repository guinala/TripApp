import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import * as Crypto from "expo-crypto";
import {
  autocompletePlaces,
  getPlaceDetails,
  isPlacesCancelled,
  PlacesError,
} from "@/services/places";
import {
  placeSessionEnabled,
  placeSessionVersion,
  rememberPlace,
  subscribePlaceSession,
} from "@/services/place-session";
import type {
  LatLng,
  PlaceLanguage,
  PlaceScope,
  PlaceSuggestion,
} from "@/types/place";

type Options = {
  scope: PlaceScope;
  languageCode: PlaceLanguage;
  initialQuery?: string;
  center?: LatLng;
  enabled?: boolean;
};

export function usePlacesAutocomplete(
  { scope, languageCode, initialQuery = "", center, enabled = true }: Options,
) {
  const epoch = useSyncExternalStore(
    subscribePlaceSession,
    placeSessionVersion,
    placeSessionVersion,
  );
  const identity = JSON.stringify([
    scope,
    languageCode,
    center?.lat,
    center?.lng,
    enabled,
    epoch,
  ]);
  const [resultKey, setResultKey] = useState("");
  const [searched, setSearched] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState<PlacesError | null>(null);
  const token = useRef<string | null>(null);
  const version = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const request = useRef<AbortController | null>(null);
  const choosing = useRef(false);
  const mounted = useRef(true);
  const textRef = useRef(initialQuery);
  const lat = center?.lat;
  const lng = center?.lng;

  const stop = useCallback(() => {
    version.current += 1;
    if (timer.current) clearTimeout(timer.current);
    request.current?.abort();
    choosing.current = false;
  }, []);

  const cancelSearch = useCallback(() => {
    stop();
    token.current = null;
    setResultKey(identity);
    setSearched(false);
    setSuggestions([]);
    setLoading(false);
    setSelecting(false);
    setError(null);
  }, [stop, identity]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stop();
    };
  }, [stop]);

  useEffect(() => {
    stop();
    token.current = null;
    return stop;
  }, [identity, stop]);

  const changeQuery = useCallback(
    (text: string) => {
      stop();
      textRef.current = text;
      setQuery(text);
      setResultKey(identity);
      setSearched(false);
      setSuggestions([]);
      setError(null);
      setLoading(false);
      setSelecting(false);

      if (!enabled || !placeSessionEnabled() || text.trim().length < 3) return;
      setLoading(true);

      const current = version.current;
      const started = placeSessionVersion();

      timer.current = setTimeout(async () => {
        token.current ??= Crypto.randomUUID();
        const controller = new AbortController();
        request.current = controller;
        setLoading(true);
        try {
          const items = await autocompletePlaces(text.trim(), token.current, {
            scope,
            languageCode,
            signal: controller.signal,
            ...(lat !== undefined && lng !== undefined
              ? { center: { lat, lng } }
              : {}),
          });
          if (
            mounted.current && current === version.current &&
            started === placeSessionVersion()
          ) {
            setSuggestions(items);
            setSearched(true);
          }
        } catch (failure) {
          if (
            mounted.current && current === version.current &&
            !isPlacesCancelled(failure)
          ) {
            setError(
              failure instanceof PlacesError
                ? failure
                : new PlacesError("NETWORK_ERROR", true),
            );
          }
        } finally {
          if (mounted.current && current === version.current) setLoading(false);
        }
      }, 300);
    },
    [enabled, languageCode, lat, lng, scope, stop, identity],
  );
  const selectPlace = useCallback(
    async (placeId: string) => {
      if (choosing.current || !enabled || !placeSessionEnabled()) {
        throw new PlacesError("CANCELLED");
      }
      const sessionToken = token.current;
      stop();
      choosing.current = true;
      const current = version.current;
      const started = placeSessionVersion();
      const controller = new AbortController();
      request.current = controller;
      // Desde que se envía Details, el token se considera consumido aunque falle la respuesta.
      token.current = null;
      setSuggestions([]);
      setSearched(false);
      setLoading(false);
      setSelecting(true);
      setError(null);
      try {
        const place = await getPlaceDetails(placeId, {
          languageCode,
          signal: controller.signal,
          ...(sessionToken ? { sessionToken } : {}),
        });
        if (
          !mounted.current || current !== version.current ||
          started !== placeSessionVersion()
        ) {
          throw new PlacesError("CANCELLED");
        }
        rememberPlace(place, languageCode, started);
        textRef.current = place.name;
        setQuery(place.name);
        return place;
      } catch (failure) {
        if (
          mounted.current && current === version.current &&
          !isPlacesCancelled(failure)
        ) {
          setError(
            failure instanceof PlacesError
              ? failure
              : new PlacesError("NETWORK_ERROR", true),
          );
        }
        throw failure;
      } finally {
        if (mounted.current && current === version.current) {
          choosing.current = false;
          setSelecting(false);
        }
      }
    },
    [enabled, languageCode, stop],
  );
  const current = resultKey === identity;
  return {
    query,
    changeQuery,
    suggestions: current ? suggestions : [],
    loading: current && loading,
    selecting: current && selecting,
    error: current ? error : null,
    searched: current && searched,
    selectPlace,
    cancelSearch,
    retrySearch: () => changeQuery(textRef.current),
  };
}
