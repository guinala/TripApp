import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useWeather } from '@/hooks/use-weather';
import type { LatLng } from '@/types/place';
import { PlacesStatus } from './PlacesStatus';
import { ui } from './PlacesUI';

export function DestinationStatsCard({ location }: { location: LatLng | null }) {
  const { t } = useTranslation();
  const state = useWeather(location?.lat ?? null, location?.lng ?? null);
  if (!location) return null;
  return (
    <View style={ui.card}>
      <Text style={ui.title}>{t('places.currentWeather')}</Text>
      <PlacesStatus loading={state.loading} error={state.error} />
      {state.weather && (
        <Text style={ui.text}>
          {state.weather.temp} °C · {state.weather.description}
        </Text>
      )}
    </View>
  );
}
