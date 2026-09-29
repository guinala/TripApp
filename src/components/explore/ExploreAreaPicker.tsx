import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePlacesAutocomplete } from '@/hooks/use-places-autocomplete';
import type { ExploreArea } from '@/types/explore';
import type { PlaceLanguage } from '@/types/place';
import { isGeographicDestination } from '@/utils/place-kind';
import { colors, fonts } from '@/constants/theme';
import { PlaceSearchResults } from './PlaceSearchResults';
import { PlacesButton, ui } from './PlacesUI';
import { PlacesStatus } from './PlacesStatus';

export function ExploreAreaPicker({
  open,
  languageCode,
  onChange,
  onAutomatic,
  onClose,
}: {
  open: boolean;
  languageCode: PlaceLanguage;
  onChange: (area: ExploreArea, label: string) => void;
  onAutomatic: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const search = usePlacesAutocomplete({
    scope: 'destinations',
    languageCode,
    enabled: open,
  });
  const select = async (placeId: string) => {
    try {
      const place = await search.selectPlace(placeId);
      if (!isGeographicDestination(place.types)) return;
      const selectedArea: ExploreArea =
        place.types.includes('country') && place.countryCode
          ? {
              kind: 'country',
              countryCode: place.countryCode,
            }
          : {
              kind: 'place',
              placeId: place.placeId,
            };

      onChange(selectedArea, place.name);
      onClose();
    } catch {
      // El hook presenta el error y conserva la búsqueda para reintentar
    }
  };

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('dynamicExplore.changeArea')}</Text>
          <PlacesButton title={t('common.cancel')} secondary onPress={onClose} />
        </View>
        <TextInput
          autoFocus
          accessibilityLabel={t('places.searchLabel')}
          style={ui.input}
          value={search.query}
          onChangeText={search.changeQuery}
          placeholder={t('places.searchPlaceholder')}
          placeholderTextColor={colors.textSecondary}
        />
        <Pressable
          accessibilityRole="button"
          style={styles.automatic}
          onPress={() => {
            onAutomatic();
            onClose();
          }}
        >
          <Text style={styles.automaticText}>{t('dynamicExplore.automaticArea')}</Text>
        </Pressable>
        <PlacesStatus
          loading={search.loading || search.selecting}
          error={search.error}
          message={
            search.searched && !search.loading && !search.error && search.suggestions.length === 0
              ? t('places.noResults')
              : undefined
          }
          onRetry={search.error ? search.retrySearch : undefined}
        />
        <View style={{ flex: 1 }}>
          <PlaceSearchResults
            suggestions={search.suggestions}
            selecting={search.selecting}
            onSelect={(placeId) => void select(placeId)}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceCream, padding: 20, paddingTop: 54, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1, fontFamily: fonts.serifItalic, fontSize: 32, color: colors.secondary },
  automatic: {
    minHeight: 48,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary100,
  },
  automaticText: { fontFamily: fonts.sansSemiBold, color: colors.primary700 },
});
