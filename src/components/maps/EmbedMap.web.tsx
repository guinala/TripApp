import { Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { LatLng } from '@/types/place';
import { isValidCoordinate } from '@/utils/mapRegion';
import { PlacesButton } from '@/components/explore/PlacesUI';
import { LoadNotice } from '@/components/ui/LoadNotice';

export function EmbedMap({
  placeId,
  location,
  title,
}: {
  placeId?: string | null;
  location?: LatLng | null;
  title: string;
}) {
  const { t, i18n } = useTranslation();
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

  if (!placeId && !isValidCoordinate(location))
    return <LoadNotice message={t('fixes.noLocation')} />;

  const query = location ? `${location.lat},${location.lng}` : title;
  const external = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}${placeId ? `&query_place_id=${encodeURIComponent(placeId)}` : ''}`;
  const params = new URLSearchParams({
    key: key ?? '',
    language: i18n.language.startsWith('es') ? 'es' : 'en',
  });
  if (placeId) params.set('q', `place_id:${placeId}`);
  else {
    params.set('center', `${location!.lat},${location!.lng}`);
    params.set('zoom', '15');
  }
  return (
    <View style={{ gap: 12 }}>
      {key ? (
        <iframe
          title={title}
          src={`https://www.google.com/maps/embed/v1/${placeId ? 'place' : 'view'}?${params}`}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          style={{ width: '100%', height: 300, border: 0, borderRadius: 16, minWidth: 200 }}
        />
      ) : (
        <LoadNotice message={t('fixes.webMapExternal')} />
      )}
      <PlacesButton
        secondary
        title={t('fixes.openMap')}
        onPress={() => {
          void Linking.openURL(external);
        }}
      />
    </View>
  );
}
