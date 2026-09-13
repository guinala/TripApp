export type LatLng = { lat: number; lng: number };
export type PlaceLanguage = 'es' | 'en';
export type PlaceViewport = { low: LatLng; high: LatLng };
export type PlaceScope = 'destinations' | 'activities';
export type InterestCategory = 'visit' | 'museum' | 'park' | 'restaurant';

export type PlaceSuggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  address: string | null;
  location: LatLng | null;
  viewport: PlaceViewport | null;
  countryCode: string | null;
  countryName: string | null;
  types: string[];
  googleMapsUri: string | null;
  attributions: { provider: string; providerUri: string | null }[];
};

export type PlaceSummary = {
  placeId: string;
  name: string;
  address: string | null;
  location: LatLng | null;
  types: string[];
  attributions: PlaceDetails['attributions'];
};

export type PlacesRequest =
  | {
      action: 'autocomplete';
      input: string;
      scope: PlaceScope;
      languageCode: PlaceLanguage;
      sessionToken: string;
      center?: LatLng;
    }
  | {
      action: 'details';
      placeId: string;
      languageCode: PlaceLanguage;
      sessionToken?: string;
    }
  | {
      action: 'nearby';
      center: LatLng;
      category: InterestCategory;
      languageCode: PlaceLanguage;
    }
  | {
      action: 'textSearch';
      query: string;
      languageCode: PlaceLanguage;
      center?: LatLng;
      pageToken?: string;
    };

export type PlacesDataByAction = {
  autocomplete: { suggestions: PlaceSuggestion[] };
  details: { place: PlaceDetails };
  nearby: { places: PlaceSummary[] };
  textSearch: { places: PlaceSummary[]; nextPageToken: string | null };
};

export type PlacesErrorCode =
  | 'INVALID_INPUT' | 'UNAUTHENTICATED' | 'RATE_LIMITED'
  | 'NOT_FOUND' | 'UPSTREAM_UNAVAILABLE' | 'TIMEOUT'
  | 'REFERENCE_SAVE_FAILED';

export type PlacesErrorBody = {
  error: { code: PlacesErrorCode; retryable: boolean };
};