import { useEffect, useState } from 'react';
import { Share, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getEditorialDestination } from '@/services/editorial-destinations';
import type { EditorialDestination } from '@/types/destination';
import { usePlaceDetails, usePlaceLanguage } from '@/hooks/use-place-details';
import { PlacesScreen, PlacesButton, ui } from '@/components/explore/places-ui';
import { PlacesStatus } from '@/components/explore/places-status';
import { PlaceDetailContent } from '@/components/explore/place-detail-content';
import { DestinationCard } from '@/components/explore/DestinationCard';
import { useAuthStore } from '@/store/authStore';

function EditorialBody({ destination }: { destination: EditorialDestination }) {
  const { t } = useTranslation();
  const resolution = usePlaceDetails(destination.placeId, usePlaceLanguage());
  const [shareError, setShareError] = useState<string | null>(null);
  return (
    <>
      <DestinationCard
        destination={destination}
        onPress={() => {
          void Share.share({ message: `${destination.name}, ${destination.country}` }).catch(() =>
            setShareError('share'),
          );
        }}
      />
      <PlacesStatus error={shareError} />
      {resolution.place ? (
        <PlaceDetailContent place={resolution.place} editorial={destination} />
      ) : (
        <>
          <Text style={ui.text} accessibilityLanguage={destination.descriptionLanguage}>
            {destination.description}
          </Text>
          <Text style={ui.text}>
            {t('places.textLanguage', { language: destination.descriptionLanguage.toUpperCase() })}
          </Text>
          <PlacesStatus
            loading={resolution.status === 'loading'}
            error={resolution.error}
            onRetry={resolution.error ? resolution.retry : undefined}
          />
          <PlacesButton
            title={t('places.createTrip')}
            onPress={() =>
              router.push({
                pathname: '/trips/new',
                params: destination.placeId
                  ? { placeId: destination.placeId }
                  : { destination: `${destination.name}, ${destination.country}` },
              })
            }
          />
          <PlacesButton
            title={t('places.searchCity')}
            secondary
            onPress={() =>
              router.push({
                pathname: '/(app)/(tabs)/explore',
                params: {
                  query: `${destination.name}, ${destination.country}`,
                  queryKey: String(Date.now()),
                },
              })
            }
          />
        </>
      )}
    </>
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

  return (
    <PlacesScreen title={t('places.editorial')}>
      {current?.destination ? (
        <EditorialBody key={id} destination={current.destination} />
      ) : (
        <PlacesStatus
          loading={!current}
          error={current?.error}
          message={current && !current.error ? t('places.notPublished') : undefined}
          onRetry={current?.error ? () => setAttempt((a) => a + 1) : undefined}
        />
      )}
    </PlacesScreen>
  );
}
