import { Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DiaryPhoto } from '@/hooks/use-diary-photos';
import { PlacesButton } from '@/components/explore/PlacesUI';
import { DiaryMap } from './DiaryMap.web';

export function FullDiaryMapModal({
  visible,
  photos,
  onClose,
  onPressPhoto,
}: {
  visible: boolean;
  photos: DiaryPhoto[];
  onClose: () => void;
  onPressPhoto?: (photo: DiaryPhoto) => void;
}) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} onRequestClose={onClose}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <PlacesButton title={t('common.back')} onPress={onClose} />
        <DiaryMap photos={photos} onPressPhoto={onPressPhoto} />
      </ScrollView>
    </Modal>
  );
}
