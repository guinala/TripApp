import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { create } from "zustand";
import { cachedBrowsePlaces } from "@/services/explore-requests";
import { isPlacesCancelled, PlacesError } from "@/services/places";
import {
  placeSessionEnabled,
  placeSessionVersion,
  subscribePlaceSession,
} from "@/services/place-session";
import type {
  BrowseSpec,
  ExploreMode,
  ExplorePlace,
  ResolvedExploreArea,
} from "@/types/explore";
import type { PlaceLanguage } from "@/types/place";
import { rankSearchPlaces } from "@/utils/explore-ranking";

type TextSearch = Extract<BrowseSpec, { kind: "text" }>;

type SubmittedSearch = {
  identity: string;
  search: TextSearch;
};

type SearchState = {
  requestId: number;
  identity: string;
  parameters: SubmittedSearch;
  rawPlaces: ExplorePlace[];
  places: ExplorePlace[];
  loading: boolean;
  completed: boolean;
  error: PlacesError | null;
  nextPageToken: string | null;
  failedPage?: string;
};

const useSearchState = create<{ value: SearchState | null }>(() => ({
  value: null,
}));

let serial = 0;

subscribePlaceSession(() => {
  useSearchState.setState({ value: null });
});

function updateRequest(
  requestId: number,
  update: (previous: SearchState) => SearchState,
) {
  useSearchState.setState((state) => {
    if (state.value?.requestId !== requestId) return state;

    return { value: update(state.value) };
  });
}

export function useExploreSearch(
  languageCode: PlaceLanguage,
  mode: ExploreMode,
  area: ResolvedExploreArea | null,
  enabled: boolean,
) {
  const epoch = useSyncExternalStore(
    subscribePlaceSession,
    placeSessionVersion,
    placeSessionVersion,
  );

  const state = useSearchState((value) => value.value);
  const request = useRef<AbortController | null>(null);

  const identity = JSON.stringify([
    languageCode,
    mode,
    area,
    epoch,
  ]);

  const cancel = useCallback(() => {
    request.current?.abort();
    request.current = null;
  }, []);

  useEffect(() => {
    cancel();
    return cancel;
  }, [cancel, identity, enabled]);

  const run = useCallback(
    async (
      parameters: SubmittedSearch,
      pageToken?: string,
      bypassCache = false,
    ) => {
      if (
        !enabled ||
        !placeSessionEnabled() ||
        parameters.identity !== identity
      ) {
        return;
      }

      cancel();

      const controller = new AbortController();
      request.current = controller;

      const requestId = ++serial;
      const previous = useSearchState.getState().value;

      const sameSearch = previous?.identity === identity &&
        JSON.stringify(previous.parameters.search) ===
          JSON.stringify(parameters.search);

      const keepPrevious = sameSearch && (!!pageToken || bypassCache);

      const invalid = parameters.search.query.length > 200;

      useSearchState.setState({
        value: {
          requestId,
          identity,
          parameters,
          rawPlaces: keepPrevious && previous ? previous.rawPlaces : [],
          places: keepPrevious && previous ? previous.places : [],
          nextPageToken: keepPrevious && previous
            ? previous.nextPageToken
            : null,
          completed: keepPrevious && previous ? previous.completed : false,
          loading: !invalid,
          error: invalid ? new PlacesError("INVALID_INPUT", false) : null,
          failedPage: pageToken,
        },
      });

      if (invalid) return;

      try {
        const data = await cachedBrowsePlaces(
          {
            ...parameters.search,
            ...(pageToken ? { pageToken } : {}),
          },
          languageCode,
          {
            signal: controller.signal,
            bypassCache,
          },
        );

        if (
          controller.signal.aborted ||
          epoch !== placeSessionVersion()
        ) {
          return;
        }

        updateRequest(requestId, (current) => {
          const previousRaw = pageToken ? current.rawPlaces : [];

          const rawPlaces = [
            ...new Map(
              [...previousRaw, ...data.places].map((place) => [
                place.placeId,
                place,
              ]),
            ).values(),
          ];

          return {
            ...current,
            rawPlaces,
            places: rankSearchPlaces(
              rawPlaces,
              parameters.search.query,
              parameters.search.mode,
            ),
            nextPageToken: data.nextPageToken,
            completed: true,
            loading: false,
            error: null,
          };
        });
      } catch (error: unknown) {
        if (
          controller.signal.aborted ||
          isPlacesCancelled(error) ||
          epoch !== placeSessionVersion()
        ) {
          return;
        }

        updateRequest(requestId, (current) => ({
          ...current,
          loading: false,
          error: error instanceof PlacesError
            ? error
            : new PlacesError("NETWORK_ERROR", true),
        }));
      } finally {
        updateRequest(
          requestId,
          (current) =>
            current.loading ? { ...current, loading: false } : current,
        );
      }
    },
    [cancel, enabled, epoch, identity, languageCode],
  );

  const search = (query: string) => {
    const clean = query.trim();

    if (!enabled || !area || clean.length < 3) return;

    const labels = mode === "cities"
      ? [area.countryName ?? area.label]
      : [area.label, area.countryName];

    const areaLabel = [
      ...new Set(
        labels
          .map((value) => value?.trim())
          .filter((value): value is string => !!value),
      ),
    ].join(", ");

    void run({
      identity,
      search: {
        kind: "text",
        mode,
        query: clean,
        areaLabel,
        ...(area.countryCode ? { countryCode: area.countryCode } : {}),
        ...(area.center ? { center: area.center } : {}),
      },
    });
  };

  const current = enabled &&
      placeSessionEnabled() &&
      state?.identity === identity
    ? state
    : null;

  return {
    places: current?.places ?? [],
    loading: current?.loading ?? false,
    error: current?.error ?? null,
    searched: current !== null,
    nextPageToken: current?.nextPageToken ?? null,

    cancel,
    search,

    // Restaura una búsqueda sin repetir una ya completada o en curso.
    ensure: (query: string) => {
      const clean = query.trim();
      const saved = useSearchState.getState().value;

      if (
        saved?.identity === identity &&
        saved.parameters.search.query === clean &&
        (saved.loading || saved.completed || saved.error)
      ) {
        return;
      }

      search(clean);
    },

    reset: () => {
      cancel();
      useSearchState.setState({ value: null });
    },

    loadMore: () => {
      if (
        current &&
        !current.loading &&
        current.nextPageToken
      ) {
        void run(current.parameters, current.nextPageToken);
      }
    },

    retry: () => {
      if (!current || current.loading) return;

      void run(
        current.parameters,
        current.error ? current.failedPage : undefined,
        true,
      );
    },
  };
}
