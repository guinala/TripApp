import { useEffect, useMemo } from 'react';
import { usePhotoStore } from '@/store/photoStore';
import { useSignedUrls } from '@/hooks/use-signed-urls';
import type { Photo } from '@/types/photo';
import type { Day } from '@/types/day';

const EMPTY_PHOTOS: Photo[] = [];

export type DiaryDayGroup = {
  day: Day | null;
  photos: Photo[];
};

export type DiaryPhoto = Photo & { uri: string | null };

function groupByDay(photos: Photo[], days: Day[]): DiaryDayGroup[] {
  const byDayId = new Map<string, Photo[]>();
  const unassigned: Photo[] = [];

  for (const photo of photos) {
    if (!photo.dayId) {
      unassigned.push(photo);
      continue;
    }
    const list = byDayId.get(photo.dayId);
    if (list) list.push(photo);
    else byDayId.set(photo.dayId, [photo]);
  }

  const groups: DiaryDayGroup[] = days
    .map((day) => ({ day, photos: byDayId.get(day.id) ?? [] }))
    .filter((g) => g.photos.length > 0);

  if (unassigned.length > 0) {
    groups.push({ day: null, photos: unassigned });
  }

  return groups;
}

export function useDiaryPhotos(tripId: string, days: Day[]) {
  const photos = usePhotoStore((s) => s.byTrip[tripId] ?? EMPTY_PHOTOS);
  const loading = usePhotoStore((s) => s.loadingByTrip[tripId] ?? false);
  const loadPhotos = usePhotoStore((s) => s.loadPhotos);

  useEffect(() => {
    loadPhotos(tripId);
  }, [tripId, loadPhotos]);

  const paths = useMemo(() => photos.map((p) => p.uri), [photos]);
  const { urls, loading: urlsLoading } = useSignedUrls(paths);

  const photosWithUrl = useMemo<DiaryPhoto[]>(
    () => photos.map((p) => ({ ...p, url: urls.get(p.uri) ?? null })),
    [photos, urls],
  );

  const groups = useMemo(() => groupByDay(photosWithUrl, days), [photosWithUrl, days]);

  return {
    photos: photosWithUrl,
    groups,
    loading,
    urlsLoading,
  };
}
