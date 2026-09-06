import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { usePlacesAutocomplete } from '@/hooks/use-places-autocomplete';

const CITY_TYPES = ['locality', 'administrative_area_level_1', 'country'];

type DestinationInputProps = {
  value: string;
  onChange: (v: string) => void;
};

export function DestinationInput({ value, onChange }: DestinationInputProps) {
  const { t } = useTranslation();
  const { setQuery, suggestions, loading, selectPlace } = usePlacesAutocomplete(CITY_TYPES);

  return (
    <View>
      <View style={styles.box}>
        <Ionicons name="location-outline" size={18} color={colors.secondary300} />
        <TextInput
          style={styles.input}
          placeholder={t('trips.form.destinationPlaceholder')}
          placeholderTextColor={colors.secondary300}
          value={value}
          onChangeText={(text) => {
            onChange(text);
            setQuery(text);
          }}
        />
        {loading ? <ActivityIndicator size="small" /> : null}
      </View>

      {suggestions.length > 0 ? (
        <View style={styles.results}>
          {suggestions.map((s) => (
            <Pressable
              key={s.placeId}
              style={styles.result}
              onPress={async () => onChange((await selectPlace(s.placeId)).name)}
            >
              <Ionicons name="location-outline" size={18} color={colors.secondary300} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {s.mainText}
                </Text>
                {s.secondaryText ? (
                  <Text style={styles.loc} numberOfLines={1}>
                    {s.secondaryText}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: colors.textSubtitle,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s4,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.base,
    color: colors.secondary,
  },
  results: {
    marginTop: spacing.s2,
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: colors.textSubtitle,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
  },
  name: { fontFamily: fonts.sansSemiBold, fontSize: fontSize.sm, color: colors.secondary },
  loc: { fontFamily: fonts.sansRegular, fontSize: fontSize.micro, color: colors.secondary300 },
});
