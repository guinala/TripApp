import { useEffect, useMemo, useState } from 'react';
import { UnsplashPhoto, getCoverPhoto, searchPhotos } from '@/services/unsplash';
import i18n from '@/i18n';

type PhotosState = {
  photos: UnsplashPhoto[];
  loading: boolean;
  error: string | null;
};

type PhotosResult = {
  key: string;
  photos: UnsplashPhoto[];
  error: string | null;
};

// Sin setState síncrono en el efecto (react-hooks/set-state-in-effect):
// el efecto solo guarda el resultado con la clave de su petición y
// `loading` se deriva en el render comparando claves.
const IDLE_PHOTOS: PhotosState = { photos: [], loading: false, error: null };

export function useUnsplashPhotos(query: string | null, perPage = 5): PhotosState {
  const [result, setResult] = useState<PhotosResult | null>(null);

  const key = query ? `${query}|${perPage}` : null;

  useEffect(() => {
    if (!key || !query) return;

    let cancelled = false;
    searchPhotos(query, perPage)
      .then((photos) => {
        if (!cancelled) setResult({ key, photos, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setResult({
            key,
            photos: [],
            error: e instanceof Error ? e.message : i18n.t('errors.loadPhotos'),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, query, perPage]);

  return useMemo(() => {
    if (key == null) return IDLE_PHOTOS;
    if (result == null || result.key !== key) {
      return { photos: [], loading: true, error: null };
    }
    return { photos: result.photos, loading: false, error: result.error };
  }, [key, result]);
}

type CoverState = {
  photo: UnsplashPhoto | null;
  loading: boolean;
};

type CoverResult = {
  key: string;
  photo: UnsplashPhoto | null;
};

const IDLE_COVER: CoverState = { photo: null, loading: false };

export function useUnsplashCover(query: string | null): CoverState {
  const [result, setResult] = useState<CoverResult | null>(null);

  useEffect(() => {
    if (!query) return;

    let cancelled = false;
    getCoverPhoto(query)
      .then((photo) => {
        if (!cancelled) setResult({ key: query, photo });
      })
      .catch(() => {
        if (!cancelled) setResult({ key: query, photo: null });
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  return useMemo(() => {
    if (!query) return IDLE_COVER;
    if (result == null || result.key !== query) return { photo: null, loading: true };
    return { photo: result.photo, loading: false };
  }, [query, result]);
}
