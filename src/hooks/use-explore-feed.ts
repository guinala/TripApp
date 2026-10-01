import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { isPlacesCancelled, PlacesError } from "@/services/places";
import {
  placeSessionEnabled,
  placeSessionVersion,
  subscribePlaceSession,
} from "@/services/place-session";
import type {
  DiscoveryReason,
  ExploreArea,
  ExploreMode,
  ExplorePlace,
  ResolvedExploreArea,
} from "@/types/explore";
import type { PlaceLanguage } from "@/types/place";
import { useExploreCacheStore } from "@/store/exploreCacheStore";
import { cachedDiscoverPlaces } from "@/services/explore-requests";

type FeedResult = {
  key: string;
  revision: number;
  places: ExplorePlace[];
  area: ResolvedExploreArea;
  reason: DiscoveryReason;
  partial: boolean;
  error: PlacesError | null;
};

export function useExploreFeed({
  mode,
  languageCode,
  area,
  fallbackCountryCode,
  timeZone,
  enabled,
  loadRecommendations = true,
}: {
  mode: ExploreMode;
  languageCode: PlaceLanguage;
  area?: ExploreArea;
  fallbackCountryCode?: string;
  timeZone?: string;
  enabled: boolean;
  loadRecommendations?: boolean;
}) {
  const epoch = useSyncExternalStore(
    subscribePlaceSession,
    placeSessionVersion,
    placeSessionVersion,
  );
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<FeedResult | null>(null);
  const request = useRef<AbortController | null>(null);
  const [areaResult, setAreaResult] = useState<
    {
      key: string;
      area: ResolvedExploreArea;
    } | null
  >(null);

  const discoveryRevision = useExploreCacheStore(
    (state) => state.discoveryRevision,
  );

  const lastRefresh = useRef(0);

  const identity = JSON.stringify([
    mode,
    languageCode,
    area ?? null,
    fallbackCountryCode ?? null,
    timeZone ?? "UTC",
    epoch,
    discoveryRevision,
  ]);

  const areaIdentity = JSON.stringify([
    languageCode,
    area ?? null,
    fallbackCountryCode ?? null,
    timeZone ?? "UTC",
    epoch,
    discoveryRevision,
  ]);

  const resolvedArea = placeSessionEnabled() && areaResult?.key === areaIdentity
    ? areaResult.area
    : null;
  const active = enabled && placeSessionEnabled();
  const shouldLoad = active && (loadRecommendations || !resolvedArea);
  const loadKey = shouldLoad ? JSON.stringify([identity, revision]) : null;

  useEffect(() => {
    if (!loadKey) {
      request.current?.abort();
      return;
    }
    const bypassCache = revision !== lastRefresh.current;
    lastRefresh.current = revision;
    const controller = new AbortController();
    request.current?.abort();
    request.current = controller;

    cachedDiscoverPlaces(
      {
        mode,
        languageCode,
        ...(area ? { area } : {}),
        ...(fallbackCountryCode ? { fallbackCountryCode } : {}),
        ...(timeZone ? { timeZone } : {}),
      },
      {
        signal: controller.signal,
        bypassCache,
      },
    )
      .then((data) => {
        if (controller.signal.aborted) return;
        setAreaResult({
          key: areaIdentity,
          area: data.area,
        });
        setResult({ key: identity, revision, ...data, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isPlacesCancelled(error)) return;
        const next = error instanceof PlacesError
          ? error
          : new PlacesError("NETWORK_ERROR", true);
        setResult((previous) =>
          previous?.key === identity
            ? { ...previous, revision, error: next }
            : {
              key: identity,
              revision,
              places: [],
              area: {
                label: "",
                countryCode: null,
                countryName: null,
                center: null,
                source: "default",
              },
              reason: mode === "cities" ? "new_cities" : "popular_in_area",
              partial: false,
              error: next,
            }
        );
      });
    return () => controller.abort();
  }, [
    active,
    area,
    fallbackCountryCode,
    identity,
    languageCode,
    loadKey,
    mode,
    revision,
    timeZone,
    areaIdentity,
  ]);

  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const current = active && result?.key === identity ? result : null;
  const loading = active && !current;
  const refreshing = active && !!current && current.revision !== revision;
  return {
    places: current?.places ?? [],
    area: resolvedArea,
    reason: current?.reason ?? null,
    partial: current?.partial ?? false,
    error: current?.error ?? null,
    loading,
    refreshing,
    refresh,
  };
}
