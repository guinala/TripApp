import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getEditorialDestination } from '@/services/editorial-destinations';
import type { EditorialDestination } from '@/types/destination';
import { usePlaceLanguage } from '@/hooks/use-place-details';
import { PlacesScreen } from '@/components/explore/PlacesUI';
import { PlacesStatus } from '@/components/explore/PlacesStatus';
import { PlaceDetailContent } from '@/components/explore/PlaceDetailContent';
import { useEditorialPlace } from '@/hooks/use-editorial-place';
import { useAuthStore } from '@/store/authStore';

function EditorialBody({ destination }: { destination: EditorialDestination }) {
  const resolution = useEditorialPlace(destination);
  return (
    <PlaceDetailContent
      place={resolution.place}
      editorial={destination}
      locating={resolution.loading}
      locationError={!!resolution.error}
      onRetryLocation={resolution.retry}
    />
  );
}

export default function EditorialScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation(),
    language = usePlaceLanguage();
  const owner = useAuthStore((s) => s.user?.id);
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([id, language, owner, attempt]);
  const [result, setResult] = useState<{
    key: string;
    destination: EditorialDestination | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getEditorialDestination(id, language)
      .then((destination) => {
        if (!cancelled) setResult({ key, destination, error: null });
      })
      .catch((e) => {
        if (!cancelled)
          setResult({ key, destination: null, error: e instanceof Error ? e.message : 'load' });
      });
    return () => {
      cancelled = true;
    };
  }, [id, language, key]);

  const current = result?.key === key ? result : null;

  if (current?.destination) return <EditorialBody key={key} destination={current.destination} />;
  return (
    <PlacesScreen title={t('places.editorial')}>
      <PlacesStatus
        loading={!current}
        error={current?.error}
        message={current && !current.error ? t('places.notPublished') : undefined}
        onRetry={current?.error ? () => setAttempt((a) => a + 1) : undefined}
      />
    </PlacesScreen>
  );
}
