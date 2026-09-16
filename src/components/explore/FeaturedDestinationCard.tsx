import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { EditorialDestination } from '@/types/destination';
import { DestinationCard } from './DestinationCard';
import { ui } from './PlacesUI';

export function FeaturedDestinationCard({
  destination,
  onPress,
}: {
  destination: EditorialDestination;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: 10 }}>
      <Text style={ui.title}>{t('explore.featured')}</Text>
      <DestinationCard destination={destination} onPress={onPress} />
    </View>
  );
}
