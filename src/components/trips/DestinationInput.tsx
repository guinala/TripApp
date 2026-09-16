import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { usePlacesAutocomplete } from '@/hooks/use-places-autocomplete';
import { usePlaceLanguage } from '@/hooks/use-place-details';
import { PlacesStatus } from '@/components/explore/places-status';
import { PlacesAttribution } from '@/components/explore/places-attribution';
import type { LatLng, PlaceDetails, PlaceScope } from '@/types/place';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSelectPlace: (place: PlaceDetails) => void;
  onSelectingChange?: (selecting: boolean) => void;
  disabled?: boolean;
  scope?: PlaceScope;
  center?: LatLng;
};
export function DestinationInput({
  value,
  onChangeText,
  onSelectPlace,
  onSelectingChange,
  disabled = false,
  scope = 'destinations',
  center,
}: Props) {
  const { t } = useTranslation();
  const languageCode = usePlaceLanguage();
  const search = usePlacesAutocomplete({ scope, languageCode, center, enabled: !disabled });
  useEffect(() => {
    onSelectingChange?.(search.selecting);
    return () => onSelectingChange?.(false);
  }, [search.selecting, onSelectingChange]);
  return (
    <View style={{ gap: spacing.s2 }}>
      <View style={styles.inputBox}>
        <TextInput
          accessibilityLabel={t('places.searchLabel')}
          editable={!disabled}
          style={styles.input}
          value={value}
          placeholder={t('places.searchLabel')}
          placeholderTextColor={colors.textSecondary}
          onChangeText={(text) => {
            onChangeText(text);
            search.changeQuery(text);
          }}
        />
        {(search.loading || search.selecting) && <ActivityIndicator color={colors.primary700} />}
      </View>
      {search.suggestions.map((s) => (
        <Pressable
          key={s.placeId}
          accessibilityRole="button"
          disabled={disabled || search.selecting}
          style={styles.row}
          onPress={() => {
            void search
              .selectPlace(s.placeId)
              .then(onSelectPlace)
              .catch(() => undefined);
          }}
        >
          <Text style={styles.name}>{s.mainText}</Text>
          <Text style={styles.secondary}>{s.secondaryText}</Text>
        </Pressable>
      ))}
      <PlacesStatus
        error={search.error}
        message={
          search.searched &&
          !search.loading &&
          !search.selecting &&
          !search.suggestions.length &&
          !search.error
            ? t('places.noResults')
            : undefined
        }
        onRetry={search.error ? search.retrySearch : undefined}
      />
      {search.suggestions.length > 0 && <PlacesAttribution />}
    </View>
  );
}
const styles = StyleSheet.create({
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondary100,
    borderRadius: radius.lg,
    backgroundColor: colors.surfacePaper,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    minHeight: 52,
    color: colors.secondary,
    fontFamily: fonts.sansRegular,
    fontSize: 15,
  },
  row: { padding: 14, minHeight: 56, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  name: { color: colors.secondary, fontFamily: fonts.sansSemiBold },
  secondary: { color: colors.textSecondary, marginTop: 4 },
});
