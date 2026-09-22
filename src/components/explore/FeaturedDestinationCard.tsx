import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ExplorePlace } from '@/types/explore';
import { DestinationCard } from './DestinationCard';
import { ui } from './PlacesUI';

export function FeaturedDestinationCard({
  place,
  onPress,
  photoEnabled = true,
}: {
  place: ExplorePlace;
  onPress: () => void;
  photoEnabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: 10 }}>
      <Text style={ui.title}>{t('explore.featured')}</Text>
      <DestinationCard
        featured
        place={place}
        onPress={onPress}
        photoEnabled={photoEnabled}
      />
    </View>
  );
}
