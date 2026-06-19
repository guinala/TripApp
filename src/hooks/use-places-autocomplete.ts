import { useCallback, useEffect, useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';
import {
  autocompletePlaces,
  getPlaceDetails,
  type PlaceDetails,
  type PlaceSuggestion,
} from '@/services/places';

export function usePlacesAutocomplete() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // Token vivo durante toda una búsqueda; se renueva al seleccionar
  const sessionToken = useRef<string>(Crypto.randomUUID());

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        setSuggestions(await autocompletePlaces(q, sessionToken.current));
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // debounce

    return () => clearTimeout(handle); // cancela si sigues tecleando
  }, [query]);

  const selectPlace = useCallback(async (placeId: string): Promise<PlaceDetails> => {
    const details = await getPlaceDetails(placeId, sessionToken.current);
    sessionToken.current = Crypto.randomUUID();
    setSuggestions([]);
    setQuery(details.name);
    return details;
  }, []);

  return { query, setQuery, suggestions, loading, selectPlace };
}
