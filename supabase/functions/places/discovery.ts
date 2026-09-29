import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/types/database.ts";
import type {
  DiscoveryResponse,
  ExplorePlace,
  ExploreRequest,
  ResolvedExploreArea,
} from "../../../src/types/explore.ts";
import type { PlaceDetails } from "../../../src/types/place.ts";
import {
  chooseExploratoryCategory,
  type ExploreAffinityWeights,
  normalizeAffinities,
  rankExplorePlaces,
} from "../../../src/utils/explore-ranking.ts";
import { isGeographicDestination } from "../../../src/utils/place-kind.ts";
import {
  googleBrowseNearby,
  googleBrowseText,
  googleDetails,
  googleDiscoverCities,
  googleNearbyCities,
  PlacesHttpError,
} from "./google.ts";

type DiscoverRequest = Extract<ExploreRequest, { action: "discover" }>;
type LimitAction = "details" | "nearby" | "textSearch";
type TripRow = Pick<
  Database["public"]["Tables"]["trips"]["Row"],
  "id" | "destination_place_id" | "start_date" | "end_date" | "trip_type"
>;
type ActivitySample = {
  id: string;
  category: string;
  place_id: string | null;
  days: { trip_id: string } | { trip_id: string }[];
};

export type DiscoveryDependencies = {
  userClient: SupabaseClient<Database>;
  userId: string;
  apiKey: string;
  request: DiscoverRequest;
  defaultCountryCode: string;
  signal?: AbortSignal;
  consume: (action: LimitAction) => Promise<void>;
};

type TripGroups = {
  active: TripRow[];
  upcoming: TripRow[];
  past: TripRow[];
  partial: boolean;
};

type ResolvedContext = {
  area: ResolvedExploreArea;
  referenceTripId: string | null;
  partial: boolean;
};

function todayInTimeZone(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

function countryName(code: string, languageCode: "es" | "en"): string {
  return new Intl.DisplayNames([languageCode], { type: "region" }).of(code) ??
    code;
}

async function readTrips(
  client: SupabaseClient<Database>,
  userId: string,
  today: string,
): Promise<TripGroups> {
  const fields = "id,destination_place_id,start_date,end_date,trip_type";
  const [activeResult, upcomingResult, pastResult] = await Promise.all([
    client
      .from("trips")
      .select(fields)
      .eq("user_id", userId)
      .lte("start_date", today)
      .gte("end_date", today)
      .order("start_date", { ascending: true })
      .order("id", { ascending: true })
      .limit(3),
    client
      .from("trips")
      .select(fields)
      .eq("user_id", userId)
      .gt("start_date", today)
      .order("start_date", { ascending: true })
      .order("id", { ascending: true })
      .limit(3),
    client
      .from("trips")
      .select(fields)
      .eq("user_id", userId)
      .lt("end_date", today)
      .order("end_date", { ascending: false })
      .order("id", { ascending: true })
      .limit(20),
  ]);
  const partial = !!activeResult.error || !!upcomingResult.error ||
    !!pastResult.error;
  return {
    active: (activeResult.data ?? []) as TripRow[],
    upcoming: (upcomingResult.data ?? []) as TripRow[],
    past: (pastResult.data ?? []) as TripRow[],
    partial,
  };
}

function detailArea(
  place: PlaceDetails,
  source: ResolvedExploreArea["source"],
  languageCode: "es" | "en",
): ResolvedExploreArea {
  if (place.types.includes("country")) {
    if (!place.countryCode) {
      throw new PlacesHttpError(
        503,
        "UPSTREAM_UNAVAILABLE",
        true,
      );
    }

    return fallbackArea(
      place.countryCode,
      languageCode,
      source,
    );
  }

  return {
    label: place.name,
    countryCode: place.countryCode,
    countryName: place.countryName,
    center: place.location,
    source,
  };
}

function fallbackArea(
  code: string,
  languageCode: "es" | "en",
  source: ResolvedExploreArea["source"],
): ResolvedExploreArea {
  const name = countryName(code, languageCode);
  return {
    label: name,
    countryCode: code,
    countryName: name,
    center: null,
    source,
  };
}

async function readActivities(
  client: SupabaseClient<Database>,
  tripIds: string[],
): Promise<{ rows: ActivitySample[]; partial: boolean }> {
  if (tripIds.length === 0) return { rows: [], partial: false };
  const result = await client
    .from("activities")
    .select("id,category,place_id,days!inner(trip_id)")
    .in("days.trip_id", tripIds)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(500);
  return {
    rows: (result.data ?? []) as unknown as ActivitySample[],
    partial: !!result.error,
  };
}

function weightsFromHistory(
  rows: ActivitySample[],
  past: TripRow[],
): ExploreAffinityWeights {
  return normalizeAffinities({
    restaurant: rows.filter((row) => row.category === "restaurant").length,
    visit: rows.filter((row) => row.category === "visit").length,
    park: past.filter((trip) => trip.trip_type === "mountain").length * 0.5,
  });
}

function activityTripId(row: ActivitySample): string | null {
  if (Array.isArray(row.days)) return row.days[0]?.trip_id ?? null;
  return row.days?.trip_id ?? null;
}

export async function discoverPlacesOnServer(
  dependencies: DiscoveryDependencies,
): Promise<DiscoveryResponse> {
  const { request, userClient, userId, apiKey, signal, consume } = dependencies;
  const today = todayInTimeZone(request.timeZone ?? "UTC");
  const trips = await readTrips(userClient, userId, today);
  let partial = trips.partial;
  let calls = 0;

  const googleCall = async <T>(
    action: LimitAction,
    work: () => Promise<T>,
  ): Promise<T> => {
    if (calls >= 5) throw new PlacesHttpError(429, "RATE_LIMITED", true);
    calls += 1;
    await consume(action);
    return work();
  };

  const resolveById = async (placeId: string) => {
    const result = await googleCall("details", () =>
      googleDetails(
        { action: "details", placeId, languageCode: request.languageCode },
        apiKey,
        signal,
      ));
    return result.place;
  };

  let context: ResolvedContext | null = null;
  if (request.area?.kind === "country") {
    context = {
      area: fallbackArea(
        request.area.countryCode,
        request.languageCode,
        "device",
      ),
      referenceTripId: null,
      partial,
    };
    context.area.source = "manual";
  } else if (request.area?.kind === "place") {
    const place = await resolveById(request.area.placeId);
    if (!isGeographicDestination(place.types)) {
      throw new PlacesHttpError(400, "INVALID_INPUT", false);
    }
    context = {
      area: detailArea(place, "manual", request.languageCode),
      referenceTripId: null,
      partial,
    };
  }

  if (!context) {
    const prioritized = [
      ...trips.active.map((trip) => ({ trip, source: "active_trip" as const })),
      ...trips.upcoming.map((trip) => ({
        trip,
        source: "upcoming_trip" as const,
      })),
      ...trips.past.map((trip) => ({ trip, source: "past_trip" as const })),
    ].filter(({ trip }) => !!trip.destination_place_id);

    for (const candidate of prioritized.slice(0, 2)) {
      try {
        const place = await resolveById(candidate.trip.destination_place_id!);
        if (isGeographicDestination(place.types)) {
          context = {
            area: detailArea(place, candidate.source, request.languageCode),
            referenceTripId: candidate.trip.id,
            partial,
          };
          break;
        }
      } catch (error) {
        if (error instanceof PlacesHttpError && error.code === "NOT_FOUND") {
          continue;
        }
        partial = true;
        break;
      }
    }
  }

  if (!context) {
    const deviceCountry = request.fallbackCountryCode;
    const code = deviceCountry ?? dependencies.defaultCountryCode;
    context = {
      area: fallbackArea(
        code,
        request.languageCode,
        deviceCountry ? "device" : "default",
      ),
      referenceTripId: null,
      partial,
    };
  }

  if (request.resolveOnly) {
    return {
      area: context.area,
      reason: request.mode === "cities" ? "new_cities" : "popular_in_area",
      places: [],
      partial,
    };
  }

  const allTrips = [...trips.active, ...trips.upcoming, ...trips.past];
  const excludedTripPlaces = new Set(
    allTrips
      .map((trip) => trip.destination_place_id)
      .filter((value): value is string => !!value),
  );
  const history = await readActivities(
    userClient,
    trips.past.map((trip) => trip.id),
  );
  const current = context.referenceTripId
    ? await readActivities(userClient, [context.referenceTripId])
    : { rows: [], partial: false };
  partial ||= history.partial || current.partial;
  const affinities = weightsFromHistory(history.rows, trips.past);
  const excludedActivities = new Set(
    current.rows
      .filter((row) => activityTripId(row) === context.referenceTripId)
      .map((row) => row.place_id)
      .filter((value): value is string => !!value),
  );

  if (request.mode === "cities") {
    const code = context.area.countryCode;

    if (!code) {
      throw new PlacesHttpError(
        503,
        "UPSTREAM_UNAVAILABLE",
        true,
      );
    }

    const name = context.area.countryName ??
      countryName(code, request.languageCode);

    const candidates = new Map<string, ExplorePlace>();
    let successfulSearch = false;
    let failure: unknown;
    let reason: DiscoveryResponse["reason"] = "new_cities";

    const add = (places: ExplorePlace[]) => {
      for (const place of places) {
        if (
          place.countryCode === code &&
          !excludedTripPlaces.has(place.placeId)
        ) {
          candidates.set(place.placeId, place);
        }
      }
    };

    try {
      const cities = await googleCall("textSearch", () =>
        googleDiscoverCities(
          name,
          code,
          request.languageCode,
          apiKey,
          signal,
        ));

      successfulSearch = true;
      add(cities);
    } catch (error) {
      partial = true;
      failure = error;
    }

    if (candidates.size < 6 && calls < 4) {
      try {
        const attractions = await googleCall(
          "textSearch",
          () =>
            googleBrowseText(
              {
                kind: "text",
                mode: "places",
                query: `tourist attractions in ${name}`,
              },
              request.languageCode,
              apiKey,
              signal,
            ),
        );

        successfulSearch = true;

        const localityCounts = new Map<string, number>();

        for (const place of attractions.places) {
          const locality = place.localityName?.trim();

          if (place.countryCode !== code || !locality) continue;

          localityCounts.set(
            locality,
            (localityCounts.get(locality) ?? 0) + 1,
          );
        }

        const names = [...localityCounts]
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, Math.min(2, 5 - calls));

        for (const [locality] of names) {
          try {
            const result = await googleCall(
              "textSearch",
              () =>
                googleBrowseText(
                  {
                    kind: "text",
                    mode: "cities",
                    query: `${locality}, ${name}`,
                  },
                  request.languageCode,
                  apiKey,
                  signal,
                ),
            );

            successfulSearch = true;
            add(result.places);
          } catch (error) {
            partial = true;
            failure ??= error;
          }
        }
      } catch (error) {
        partial = true;
        failure ??= error;
      }
    }

    if (
      candidates.size === 0 &&
      context.area.center &&
      calls < 5
    ) {
      try {
        const nearby = await googleCall("nearby", () =>
          googleNearbyCities(
            context.area.center!,
            request.languageCode,
            apiKey,
            signal,
          ));

        successfulSearch = true;
        add(nearby);
        reason = "nearby_cities";
      } catch (error) {
        partial = true;
        failure ??= error;
      }
    }

    if (!successfulSearch) {
      throw failure instanceof PlacesHttpError ? failure : new PlacesHttpError(
        503,
        "UPSTREAM_UNAVAILABLE",
        true,
      );
    }

    return {
      area: context.area,
      reason,
      places: [...candidates.values()].slice(0, 20),
      partial,
    };
  }

  const category = chooseExploratoryCategory(affinities);
  const searches: Promise<ExplorePlace[]>[] = [];
  if (context.area.center) {
    searches.push(
      googleCall("nearby", async () =>
        (await googleBrowseNearby(
          context.area.center!,
          "visit",
          request.languageCode,
          apiKey,
          signal,
        )).places),
      googleCall("nearby", async () =>
        (await googleBrowseNearby(
          context.area.center!,
          category,
          request.languageCode,
          apiKey,
          signal,
        )).places),
    );
  } else {
    const areaName = context.area.countryName ?? context.area.label;
    const categoryTerm: Record<typeof category, string> = {
      visit: "tourist attractions",
      museum: "museums",
      park: "parks",
      restaurant: "restaurants",
    };
    for (
      const query of [
        `tourist attractions in ${areaName}`,
        `${categoryTerm[category]} in ${areaName}`,
      ]
    ) {
      searches.push(
        googleCall("textSearch", async () =>
          (await googleBrowseText(
            { kind: "text", mode: "places", query },
            request.languageCode,
            apiKey,
            signal,
          )).places),
      );
    }
  }

  const results = await Promise.allSettled(searches);
  const successful = results.filter(
    (result): result is PromiseFulfilledResult<ExplorePlace[]> =>
      result.status === "fulfilled",
  );
  if (successful.length === 0) {
    const failure = results.find((result): result is PromiseRejectedResult =>
      result.status === "rejected"
    );
    throw failure?.reason instanceof PlacesHttpError
      ? failure.reason
      : new PlacesHttpError(503, "UPSTREAM_UNAVAILABLE", true);
  }
  partial ||= successful.length !== results.length;
  const candidates = successful.flatMap((result) => result.value);
  const places = rankExplorePlaces(
    candidates,
    affinities,
    excludedActivities,
    context.area.center,
    category,
  );
  const hasHistory =
    Math.max(affinities.restaurant, affinities.visit, affinities.park) > 0;
  const reason: DiscoveryResponse["reason"] = context.referenceTripId
    ? "for_trip"
    : hasHistory
    ? "based_on_history"
    : "popular_in_area";
  return { area: context.area, reason, places, partial };
}
