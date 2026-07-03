import { useEffect, useState } from 'react';
import { UnsplashPhoto, getCoverPhoto, searchPhotos } from '@/services/unsplash';

type PhotosState = {
  photos: UnsplashPhoto[];
  loading: boolean;
  error: string | null;
};

export function useUnsplashPhotos(query: string | null, perPage = 5): PhotosState {
  const [state, setState] = useState<PhotosState>({
    photos: [],
    loading: query != null,
    error: null,
  });

  useEffect(() => {
    if (!query) {
      setState({ photos: [], loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    searchPhotos(query, perPage)
      .then((photos) => {
        if (!cancelled) setState({ photos, loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setState({
            photos: [],
            loading: false,
            error: e instanceof Error ? e.message : 'No se pudieron cargar las fotos',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query, perPage]);

  return state;
}

type CoverState = {
  photo: UnsplashPhoto | null;
  loading: boolean;
};

export function useUnsplashCover(query: string | null): CoverState {
  const [state, setState] = useState<CoverState>({ photo: null, loading: query != null });

  useEffect(() => {
    if (!query) {
      setState({ photo: null, loading: false });
      return;
    }

    let cancelled = false;
    setState({ photo: null, loading: true });

    getCoverPhoto(query)
      .then((photo) => {
        if (!cancelled) setState({ photo, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ photo: null, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  return state;
}
