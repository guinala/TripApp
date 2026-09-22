import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { browsePlaces, isPlacesCancelled, PlacesError } from '@/services/places';
import {
  placeSessionEnabled,
  placeSessionVersion,
  subscribePlaceSession,
} from '@/services/place-session';
import type { ExploreMode, ExplorePlace } from '@/types/explore';
import type { LatLng, PlaceLanguage } from '@/types/place';

type SubmittedSearch = { query: string; mode: ExploreMode; center?: LatLng };

export function useExploreSearch(
  languageCode: PlaceLanguage,
  mode: ExploreMode,
  center: LatLng | null,
  enabled: boolean,
) {
  const epoch = useSyncExternalStore(
    subscribePlaceSession,
    placeSessionVersion,
    placeSessionVersion,
  );
  const [places, setPlaces] = useState<ExplorePlace[]>([]);
  const [stateKey, setStateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PlacesError | null>(null);
  const [searched, setSearched] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const version = useRef(0);
  const submitted = useRef<SubmittedSearch | null>(null);
  const failedPage = useRef<string | undefined>(undefined);
  const identity = JSON.stringify([languageCode, mode, epoch, enabled]);

  const cancel = useCallback(() => {
    version.current += 1;
    request.current?.abort();
    request.current = null;
  }, []);

  const reset = useCallback(() => {
    cancel();
    submitted.current = null;
    failedPage.current = undefined;
    setStateKey(identity);
    setPlaces([]);
    setError(null);
    setSearched(false);
    setNextPageToken(null);
  }, [cancel, identity]);

  useEffect(() => {
    cancel();
    return cancel;
  }, [cancel, identity]);

  const run = useCallback(async (parameters: SubmittedSearch, pageToken?: string) => {
    if (!enabled || !placeSessionEnabled() || parameters.query.trim().length < 3) return;
    const own = ++version.current;
    const controller = new AbortController();
    request.current?.abort();
    request.current = controller;
    setStateKey(identity);
    setLoading(true);
    setError(null);
    setSearched(true);
    failedPage.current = pageToken;
    try {
      const data = await browsePlaces(
        {
          kind: 'text',
          mode: parameters.mode,
          query: parameters.query,
          ...(parameters.center ? { center: parameters.center } : {}),
          ...(pageToken ? { pageToken } : {}),
        },
        languageCode,
        { signal: controller.signal },
      );
      if (own !== version.current) return;
      setPlaces((previous) => [
        ...new Map(
          [...(pageToken ? previous : []), ...data.places].map((place) => [place.placeId, place]),
        ).values(),
      ]);
      setNextPageToken(data.nextPageToken);
    } catch (caught) {
      if (own === version.current && !isPlacesCancelled(caught)) {
        setError(caught instanceof PlacesError ? caught : new PlacesError('NETWORK_ERROR', true));
      }
    } finally {
      if (own === version.current) setLoading(false);
    }
  }, [enabled, identity, languageCode]);

  const current = stateKey === identity;

  return {
    places: current ? places : [],
    loading: current && loading,
    error: current ? error : null,
    searched: current && searched,
    nextPageToken: current ? nextPageToken : null,
    cancel,
    reset,
    search: (query: string) => {
      reset();
      const parameters: SubmittedSearch = {
        query: query.trim(),
        mode,
        ...(center ? { center } : {}),
      };
      submitted.current = parameters;
      void run(parameters);
    },
    loadMore: () => {
      if (current && submitted.current && nextPageToken) void run(submitted.current, nextPageToken);
    },
    retry: () => {
      if (current && submitted.current) void run(submitted.current, failedPage.current);
    },
  };
}
