import { useEffect, useState, useSyncExternalStore } from 'react';
import type { EditorialDestination } from '@/types/destination';
import type { PlaceDetails } from '@/types/place';
import { usePlaceDetails, usePlaceLanguage } from './use-place-details';
import { listEditorialDestinations } from '@/services/editorial-destinations';
import { searchPlacesByText } from '@/services/places';
import {
  placeSessionEnabled,
  placeSessionVersion,
  resolvePlace,
  subscribePlaceSession,
} from '@/services/place-session';
import { isDestination, matchesEditorialPlace } from '@/utils/editorial-place';
import { useAuthStore } from '@/store/authStore';

export function useEditorialForPlace(place: PlaceDetails) {
  const language = usePlaceLanguage();
  const owner = useAuthStore((s) => s.user?.id);
  const key = JSON.stringify([place.placeId, language, owner]);
  const [result, setResult] = useState<{ key: string; destination?: EditorialDestination }>();
  useEffect(() => {
    if (!owner || !isDestination(place.types)) return;
    let cancelled = false;
    listEditorialDestinations(language)
      .then(async (items) => {
        let destination = items.find((item) => matchesEditorialPlace(item, place));
        if (
          !destination &&
          language === 'en' &&
          items.some((item) => item.countryCode === place.countryCode)
        ) {
          if (cancelled) return;
          const spanishPlace = await resolvePlace(place.placeId, 'es');
          destination = items.find((item) => matchesEditorialPlace(item, spanishPlace));
        }
        if (!cancelled) setResult({ key, destination });
      })
      .catch(() => {
        /* El contenido editorial es opcional para un resultado de Google. */
      });
    return () => {
      cancelled = true;
    };
  }, [key, language, owner, place]);
  return result?.key === key ? result.destination : undefined;
}

export function useEditorialPlace(destination: EditorialDestination) {
  const language = usePlaceLanguage();
  const owner = useAuthStore((s) => s.user?.id);
  const epoch = useSyncExternalStore(
    subscribePlaceSession,
    placeSessionVersion,
    placeSessionVersion,
  );
  const enabled = !!owner && placeSessionEnabled();
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([
    destination.id,
    destination.placeId,
    language,
    owner,
    epoch,
    attempt,
  ]);
  const [result, setResult] = useState<{
    key: string;
    place: PlaceDetails | null;
    error: string | null;
  }>();
  const linked = usePlaceDetails(destination.placeId, language);
  useEffect(() => {
    if (destination.placeId || !enabled) return;
    const controller = new AbortController();
    let cancelled = false;
    // El catálogo está en español. Resolver en ese idioma permite comparar nombres
    // sin confundir ciudades homónimas; después se solicita el idioma de la pantalla.
    async function resolve() {
      const { places } = await searchPlacesByText(`${destination.name}, ${destination.country}`, {
        languageCode: 'es',
        signal: controller.signal,
      });
      for (const candidate of places.filter((p) => isDestination(p.types)).slice(0, 3)) {
        if (cancelled) return null;
        const detail = await resolvePlace(candidate.placeId, 'es');
        if (matchesEditorialPlace(destination, detail)) {
          return language === 'es' ? detail : resolvePlace(candidate.placeId, language);
        }
      }
      return null;
    }
    void resolve()
      .then((place) => {
        if (!cancelled) setResult({ key, place, error: place ? null : 'location' });
      })
      .catch(() => {
        if (!cancelled) setResult({ key, place: null, error: 'location' });
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [destination, key, language, enabled]);
  if (destination.placeId)
    return {
      place: linked.place,
      loading: linked.status === 'loading',
      error: linked.error,
      retry: linked.retry,
    };
  const current = enabled && result?.key === key ? result : undefined;
  return {
    place: current?.place ?? null,
    loading: enabled && !current,
    error: current?.error,
    retry: () => setAttempt((n) => n + 1),
  };
}
