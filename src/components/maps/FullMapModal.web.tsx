import { Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PlacesButton } from '@/components/explore/PlacesUI';
import TripMap from './TripMap.web';

export function FullMapModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} onRequestClose={onClose}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <PlacesButton title={t('common.back')} onPress={onClose} />
        <TripMap />
      </ScrollView>
    </Modal>
  );
}
