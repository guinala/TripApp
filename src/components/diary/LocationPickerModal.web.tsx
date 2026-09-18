import { useState } from 'react';
import { Modal, ScrollView, TextInput, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { LatLng, MapRegion } from '@/utils/mapRegion';
import { isValidCoordinate } from '@/utils/mapRegion';
import { PlacesButton, ui } from '@/components/explore/PlacesUI';
import { EmbedMap } from '@/components/maps/EmbedMap.web';

type Props = {
  visible: boolean;
  initialLocation: LatLng | null;
  fallbackRegion?: MapRegion;
  resetKey?: string;
  onClose: () => void;
  onConfirm: (location: LatLng | null) => void;
};

function Editor({ initialLocation, onClose, onConfirm }: Props) {
  const { t } = useTranslation();
  const [lat, setLat] = useState(initialLocation ? String(initialLocation.lat) : '');
  const [lng, setLng] = useState(initialLocation ? String(initialLocation.lng) : '');
  const candidate = { lat: Number(lat.replace(',', '.')), lng: Number(lng.replace(',', '.')) };
  const location = lat.trim() && lng.trim() && isValidCoordinate(candidate) ? candidate : null;
  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text style={ui.text}>{t('fixes.coordinatesHelp')}</Text>
      <TextInput
        style={ui.input}
        accessibilityLabel={t('fixes.latitude')}
        placeholder={t('fixes.latitude')}
        value={lat}
        onChangeText={setLat}
      />
      <TextInput
        style={ui.input}
        accessibilityLabel={t('fixes.longitude')}
        placeholder={t('fixes.longitude')}
        value={lng}
        onChangeText={setLng}
      />
      <EmbedMap title={t('fixes.photoLocation')} location={location} />
      <PlacesButton
        title={t('common.save')}
        disabled={!location}
        onPress={() => onConfirm(location)}
      />
      <PlacesButton title={t('fixes.removeLocation')} secondary onPress={() => onConfirm(null)} />
      <PlacesButton title={t('common.cancel')} secondary onPress={onClose} />
    </ScrollView>
  );
}

export function LocationPickerModal(props: Props) {
  return (
    <Modal visible={props.visible} onRequestClose={props.onClose}>
      {props.visible && (
        <Editor key={props.resetKey ?? JSON.stringify(props.initialLocation)} {...props} />
      )}
    </Modal>
  );
}
