import { createTtlCache } from '@/utils/ttlCache';

// Unsplash
const BASE_URL = 'https://api.unsplash.com/search/photos';
const ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

export type UnsplashPhoto = {
  id: string;
  thumbUrl: string;
  smallUrl: string;
  regularUrl: string;
  alt: string | null;
  authorName: string;
  authorLink: string;
};

const cache = createTtlCache<UnsplashPhoto[]>(CACHE_TTL_MS);

export async function searchPhotos(query: string, perPage = 5): Promise<UnsplashPhoto[]> {
  const key = `${query.toLowerCase().trim()}|${perPage}`;
  const cached = cache.get(key);
  if (cached) return cached;

  if (!ACCESS_KEY) {
    throw new Error('Falta EXPO_PUBLIC_UNSPLASH_ACCESS_KEY en el entorno');
  }

  const params = new URLSearchParams({
    query,
    per_page: String(perPage),
    orientation: 'landscape',
    content_filter: 'high',
  });

  const res = await fetch(`${BASE_URL}?${params.toString()}`, {
    headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`Unsplash respondió ${res.status}`);
  }

  const json = (await res.json()) as {
    results: {
      id: string;
      alt_description: string | null;
      urls: { thumb: string; small: string; regular: string };
      user: { name: string; links: { html: string } };
    }[];
  };

  const photos: UnsplashPhoto[] = json.results.map((r) => ({
    id: r.id,
    thumbUrl: r.urls.thumb,
    smallUrl: r.urls.small,
    regularUrl: r.urls.regular,
    alt: r.alt_description,
    authorName: r.user.name,
    authorLink: r.user.links.html,
  }));

  cache.set(key, photos);
  return photos;
}

export async function getCoverPhoto(query: string): Promise<UnsplashPhoto | null> {
  const photos = await searchPhotos(query, 1);
  return photos[0] ?? null;
}
