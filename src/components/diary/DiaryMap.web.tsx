import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DiaryPhoto } from '@/hooks/use-diary-photos';
import { PlacesButton } from '@/components/explore/PlacesUI';
import { EmbedMap } from '@/components/maps/EmbedMap.web';
import { isValidCoordinate } from '@/utils/mapRegion';

export function DiaryMap({
  photos,
  style,
  onPressPhoto,
}: {
  photos: DiaryPhoto[];
  style?: object;
  onPressPhoto?: (photo: DiaryPhoto) => void;
}) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const located = photos.filter((photo) => isValidCoordinate(photo.location));
  const photo = located.find((item) => item.id === selected) ?? located[0];
  return (
    <View style={[style, { gap: 12 }]}>
      <EmbedMap title={photo?.caption ?? t('fixes.photoLocation')} location={photo?.location} />
      {located.map((item, index) => (
        <PlacesButton
          key={item.id}
          secondary={photo?.id !== item.id}
          title={item.caption || `${index + 1}`}
          onPress={() => setSelected(item.id)}
        />
      ))}
      {photo && onPressPhoto && (
        <PlacesButton title={t('fixes.openPhoto')} onPress={() => onPressPhoto(photo)} />
      )}
    </View>
  );
}
