import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  browsePlaces,
  isPlacesCancelled,
  PlacesError,
} from "@/services/places";
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
  identity: string;
  places: ExplorePlace[];
  loading: boolean;
  error: PlacesError | null;
  nextPageToken: string | null;
};

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

  const [state, setState] = useState<SearchState | null>(null);

  const request = useRef<AbortController | null>(null);
  const version = useRef(0);
  const submitted = useRef<SubmittedSearch | null>(null);
  const failedPage = useRef<string | undefined>(undefined);

  // Perder el foco no cambia la identidad de los resultados.
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

  const reset = useCallback(() => {
    cancel();
    version.current += 1;
    submitted.current = null;
    failedPage.current = undefined;
    setState(null);
  }, [cancel]);

  useEffect(() => {
    cancel();
    return cancel;
  }, [cancel, identity, enabled]);

  const run = useCallback(async (
    parameters: SubmittedSearch,
    pageToken?: string,
  ) => {
    if (
      !enabled ||
      !placeSessionEnabled() ||
      parameters.identity !== identity
    ) {
      return;
    }

    const own = ++version.current;
    request.current?.abort();

    const controller = new AbortController();
    request.current = controller;
    failedPage.current = pageToken;

    setState((previous) => ({
      identity,
      places: pageToken && previous?.identity === identity
        ? previous.places
        : [],
      nextPageToken: pageToken && previous?.identity === identity
        ? previous.nextPageToken
        : null,
      loading: true,
      error: null,
    }));

    try {
      const data = await browsePlaces(
        {
          ...parameters.search,
          ...(pageToken ? { pageToken } : {}),
        },
        languageCode,
        { signal: controller.signal },
      );

      if (controller.signal.aborted || own !== version.current) {
        return;
      }

      setState((previous) => {
        const previousPlaces = pageToken && previous?.identity === identity
          ? previous.places
          : [];

        const merged = [
          ...new Map(
            [...previousPlaces, ...data.places]
              .map((place) => [place.placeId, place]),
          ).values(),
        ];

        return {
          identity,
          places: rankSearchPlaces(
            merged,
            parameters.search.query,
            parameters.search.mode,
          ),
          nextPageToken: data.nextPageToken,
          loading: false,
          error: null,
        };
      });
    } catch (error: unknown) {
      if (
        controller.signal.aborted ||
        own !== version.current ||
        isPlacesCancelled(error)
      ) {
        return;
      }

      setState((previous) =>
        previous?.identity === identity
          ? {
            ...previous,
            loading: false,
            error: error instanceof PlacesError
              ? error
              : new PlacesError("NETWORK_ERROR", true),
          }
          : previous
      );
    } finally {
      if (own === version.current) {
        setState((previous) =>
          previous?.identity === identity && previous.loading
            ? { ...previous, loading: false }
            : previous
        );
      }
    }
  }, [enabled, identity, languageCode]);

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
    reset,

    search: (query: string) => {
      const clean = query.trim();

      if (!enabled || !area || clean.length < 3) return;

      reset();

      if (clean.length > 200) {
        setState({
          identity,
          places: [],
          loading: false,
          nextPageToken: null,
          error: new PlacesError("INVALID_INPUT", false),
        });
        return;
      }

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

      const parameters: SubmittedSearch = {
        identity,
        search: {
          kind: "text",
          mode,
          query: clean,
          areaLabel,
          ...(area.countryCode ? { countryCode: area.countryCode } : {}),
          ...(area.center ? { center: area.center } : {}),
        },
      };

      submitted.current = parameters;
      void run(parameters);
    },

    loadMore: () => {
      if (
        current &&
        !current.loading &&
        current.nextPageToken &&
        submitted.current?.identity === identity
      ) {
        void run(
          submitted.current,
          current.nextPageToken,
        );
      }
    },

    retry: () => {
      if (
        current &&
        !current.loading &&
        submitted.current?.identity === identity
      ) {
        void run(submitted.current, failedPage.current);
      }
    },
  };
}
