import type {
  InterestCategory,
  LatLng,
  PlaceDetails,
  PlaceLanguage,
  PlaceSummary,
} from "./place.ts";

export type ExploreMode = "cities" | "places";

export type PriceLevel =
  | "free"
  | "inexpensive"
  | "moderate"
  | "expensive"
  | "very_expensive";

export type ExploreMetrics = {
  rating: number | null;
  ratingCount: number | null;
  priceLevel: PriceLevel | null;
};

export type ExplorePlace =
  & PlaceSummary
  & ExploreMetrics
  & {
    countryCode: string | null;
    countryName: string | null;
    localityName: string | null;
    primaryType: string | null;
  };

export type ExploreArea =
  | { kind: "country"; countryCode: string }
  | { kind: "place"; placeId: string };

export type ResolvedExploreArea = {
  label: string;
  countryCode: string | null;
  countryName: string | null;
  center: LatLng | null;
  source:
    | "manual"
    | "active_trip"
    | "upcoming_trip"
    | "past_trip"
    | "device"
    | "default";
};

export type DiscoveryReason =
  | "new_cities"
  | "nearby_cities"
  | "for_trip"
  | "based_on_history"
  | "popular_in_area";

export type DiscoveryResponse = {
  area: ResolvedExploreArea;
  reason: DiscoveryReason;
  places: ExplorePlace[];
  partial: boolean;
};

export type BrowseSpec =
  | {
    kind: "text";
    mode: ExploreMode;
    query: string;
    center?: LatLng;
    pageToken?: string;
    areaLabel?: string;
    countryCode?: string;
  }
  | {
    kind: "nearby";
    center: LatLng;
    category: InterestCategory;
  };

export type BrowseResponse = {
  places: ExplorePlace[];
  nextPageToken: string | null;
};

export type PlaceContent = ExploreMetrics & {
  place: PlaceDetails;
  description: { text: string; languageCode: string | null } | null;
};

export type PhotoCredit = {
  name: string;
  uri: string | null;
};

export type GooglePlacePhoto = {
  placeId: string;
  uri: string;
  widthPx: number | null;
  heightPx: number | null;
  credits: PhotoCredit[];
};

export type ExploreRequest =
  | {
    action: "discover";
    resolveOnly?: boolean;
    mode: ExploreMode;
    languageCode: PlaceLanguage;
    area?: ExploreArea;
    fallbackCountryCode?: string;
    timeZone?: string;
  }
  | { action: "browse"; languageCode: PlaceLanguage; search: BrowseSpec }
  | { action: "content"; languageCode: PlaceLanguage; placeId: string }
  | {
    action: "photo";
    languageCode: PlaceLanguage;
    placeId: string;
    size: "card" | "hero";
  };

export type ExploreDataByAction = {
  discover: DiscoveryResponse;
  browse: BrowseResponse;
  content: { content: PlaceContent };
  photo: { photo: GooglePlacePhoto | null };
};
