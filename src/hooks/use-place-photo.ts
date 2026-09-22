import { useEffect, useState, useSyncExternalStore } from 'react';
import { getPlacePhoto, isPlacesCancelled, PlacesError } from '@/services/places';
import { getCoverPhoto } from '@/services/unsplash';
import {
  placeSessionEnabled,
  placeSessionVersion,
  subscribePlaceSession,
} from '@/services/place-session';
import type { PlacePhoto } from '@/types/place-photo';
import type { PlaceLanguage } from '@/types/place';
import {
  photoImageFailureAction,
  resolveInitialPhoto,
} from '@/utils/place-photo-fallback';

type Command = {
  revision: number;
  start: 'unsplash' | 'google';
  bypassCache: boolean;
  googleLoad: 1 | 2;
};

type PhotoResult = {
  key: string;
  photo: PlacePhoto | null;
  error: PlacesError | Error | null;
  googleLoads: number;
};

const INITIAL_COMMAND: Command = {
  revision: 0,
  start: 'unsplash',
  bypassCache: false,
  googleLoad: 1,
};

function createLimiter(limit: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  const pump = () => {
    while (active < limit && queue.length) queue.shift()?.();
  };
  return <T,>(work: () => Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      queue.push(() => {
        active += 1;
        work().then(resolve, reject).finally(() => {
          active -= 1;
          pump();
        });
      });
      pump();
    });
}

const limitUnsplash = createLimiter(3);
const limitGoogle = createLimiter(2);

export function buildPlacePhotoQuery(
  name: string,
  localityName?: string | null,
  countryName?: string | null,
) {
  return [...new Set([name, localityName, countryName].map((value) => value?.trim()).filter(Boolean))]
    .join(' ');
}

export function usePlacePhoto({
  placeId,
  name,
  localityName,
  countryName,
  size,
  languageCode,
  enabled,
}: {
  placeId: string;
  name: string;
  localityName?: string | null;
  countryName?: string | null;
  size: 'card' | 'hero';
  languageCode: PlaceLanguage;
  enabled: boolean;
}) {
  const epoch = useSyncExternalStore(
    subscribePlaceSession,
    placeSessionVersion,
    placeSessionVersion,
  );
  const query = buildPlacePhotoQuery(name, localityName, countryName);
  const identity = JSON.stringify([
    placeId,
    query,
    size,
    languageCode,
    epoch,
  ]);
  const [commandState, setCommandState] = useState<{ identity: string; value: Command }>({
    identity: '',
    value: INITIAL_COMMAND,
  });
  const command = commandState.identity === identity ? commandState.value : INITIAL_COMMAND;
  const [result, setResult] = useState<PhotoResult | null>(null);
  const active = enabled && placeSessionEnabled() && !!placeId && !!query;
  const key = active ? JSON.stringify([identity, command]) : '';

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const loadGoogle = () =>
      limitGoogle(() =>
        getPlacePhoto(placeId, size, languageCode, { signal: controller.signal }),
      );
    const showGoogle = (value: Awaited<ReturnType<typeof loadGoogle>>, googleLoad: 1 | 2) => {
      if (controller.signal.aborted) return;
      setResult({
        key,
        photo: value
          ? { provider: 'google', uri: value.uri, credits: value.credits }
          : null,
        error: null,
        googleLoads: googleLoad,
      });
    };
    const run = async () => {
      if (command.start === 'google') {
        showGoogle(await loadGoogle(), command.googleLoad);
        return;
      }
      const selected = await resolveInitialPhoto(
        () => limitUnsplash(() =>
          getCoverPhoto(query, {
            signal: controller.signal,
            bypassCache: command.bypassCache,
          }),
        ),
        loadGoogle,
        (error) =>
          controller.signal.aborted ||
          (error instanceof Error && error.name === 'AbortError'),
      );
      if (controller.signal.aborted) return;
      if (selected.provider === 'unsplash') {
          const photo = selected.value;
          const uri = size === 'hero' ? photo.regularUrl : photo.smallUrl;
          setResult({
            key,
            photo: {
              provider: 'unsplash',
              uri,
              photoId: photo.id,
              credits: [
                { name: photo.authorName, uri: photo.authorLink },
                {
                  name: 'Unsplash',
                  uri: 'https://unsplash.com/?utm_source=tripmate&utm_medium=referral',
                },
              ],
            },
            error: null,
            googleLoads: 0,
          });
          return;
      }
      showGoogle(selected.value, 1);
    };
    run().catch((error: unknown) => {
      if (controller.signal.aborted || isPlacesCancelled(error)) return;
      setResult({
        key,
        photo: null,
        error: error instanceof PlacesError || error instanceof Error
          ? error
          : new Error('PHOTO_ERROR'),
        googleLoads: command.googleLoad,
      });
    });
    return () => controller.abort();
  }, [active, command, key, languageCode, placeId, query, size]);

  const retry = () => {
    setCommandState((previous) => {
      const value = previous.identity === identity ? previous.value : INITIAL_COMMAND;
      return {
        identity,
        value: {
          revision: value.revision + 1,
          start: 'unsplash',
          bypassCache: true,
          googleLoad: 1,
        },
      };
    });
  };

  const reportImageError = () => {
    if (result?.key !== key || !result.photo) return;
    const action = photoImageFailureAction(result.photo.provider, result.googleLoads);
    if (action.kind === 'request_google') {
      setCommandState((previous) => {
        const value = previous.identity === identity ? previous.value : INITIAL_COMMAND;
        return {
          identity,
          value: {
            revision: value.revision + 1,
            start: 'google',
            bypassCache: false,
            googleLoad: action.load,
          },
        };
      });
      return;
    }
    setResult({ key, photo: null, error: new Error('PHOTO_RENDER_ERROR'), googleLoads: 2 });
  };

  if (!active) {
    return { photo: null, loading: false, error: null, retry, reportImageError };
  }
  if (result?.key !== key) {
    return { photo: null, loading: true, error: null, retry, reportImageError };
  }
  return {
    photo: result.photo,
    loading: false,
    error: result.error,
    retry,
    reportImageError,
  };
}
