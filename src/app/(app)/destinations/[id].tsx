import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PlacesButton, PlacesScreen } from '@/components/explore/PlacesUI';
import { PlacesStatus } from '@/components/explore/PlacesStatus';

export default function LegacyDestinationScreen() {
  const { t } = useTranslation();
  return (
    <PlacesScreen title={t('places.explore')}>
      <PlacesStatus message={t('dynamicExplore.legacyLink')} />
      <PlacesButton
        title={t('dynamicExplore.openExplore')}
        onPress={() => router.replace('/(app)/(tabs)/explore')}
      />
    </PlacesScreen>
  );
}
