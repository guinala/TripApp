import { useCallback, useEffect, useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';
import {
  autocompletePlaces,
  getPlaceDetails,
  type PlaceDetails,
  type PlaceSuggestion,
} from '@/services/places';

export function usePlacesAutocomplete(includedPrimaryTypes?: string[]) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const sessionToken = useRef<string>(Crypto.randomUUID());
  const skipNext = useRef(false);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const q = query.trim();
    const handle = setTimeout(async () => {
      if (q.length < 3) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        setSuggestions(await autocompletePlaces(q, sessionToken.current, includedPrimaryTypes));
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, q.length < 3 ? 0 : 300);
    return () => clearTimeout(handle);
  }, [query, includedPrimaryTypes]);

  const selectPlace = useCallback(async (placeId: string): Promise<PlaceDetails> => {
    const details = await getPlaceDetails(placeId, sessionToken.current);
    sessionToken.current = Crypto.randomUUID();
    skipNext.current = true;
    setQuery(details.name);
    setSuggestions([]);
    return details;
  }, []);

  return { query, setQuery, suggestions, loading, selectPlace };
}
