import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useUnsplashPhotos } from '@/hooks/use-unsplash-photos';
import { useCoverPickerStore } from '@/store/coverPickerStore';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import type { UnsplashPhoto } from '@/services/unsplash';

export default function CoverSearchScreen() {
  const { t } = useTranslation();
  const { query: initialQuery } = useLocalSearchParams<{ query?: string }>();
  const select = useCoverPickerStore((s) => s.select);
  const [query, setQuery] = useState(initialQuery ?? '');
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery ?? '');
  const { photos, loading, error } = useUnsplashPhotos(submittedQuery || null, 12);

  const submit = () => setSubmittedQuery(query.trim());

  const choose = (photo: UnsplashPhoto) => {
    select(photo);
    router.back();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel={t('common.back')}>
          <Ionicons name="arrow-back" size={22} color={colors.secondary} />
        </Pressable>
        <Text style={styles.title}>{t('trips.form.searchCoverTitle')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.secondary300} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={submit}
          returnKeyType="search"
          placeholder={t('trips.form.searchCoverPlaceholder')}
          placeholderTextColor={colors.secondary300}
          style={styles.input}
        />
        <Pressable onPress={submit} hitSlop={8} accessibilityLabel={t('common.search')}>
          <Ionicons name="arrow-forward-circle" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{t('trips.form.searchCoverError')}</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          numColumns={2}
          keyExtractor={(photo) => photo.id}
          columnWrapperStyle={styles.columns}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <Pressable style={styles.photoCard} onPress={() => choose(item)}>
              <Image source={{ uri: item.smallUrl }} style={styles.photo} />
              <Text style={styles.credit} numberOfLines={1}>
                {t('trips.form.photoBy', { name: item.authorName })}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            submittedQuery ? (
              <Text style={styles.empty}>{t('trips.form.noCoverResults')}</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceCream, padding: spacing.s5 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.s2,
    marginBottom: spacing.s4,
  },
  headerSpacer: { width: 22 },
  title: { fontFamily: fonts.sansBold, fontSize: fontSize.input, color: colors.secondary },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: colors.secondary100,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.base,
    color: colors.secondary,
  },
  grid: { gap: spacing.s3, paddingTop: spacing.s4, paddingBottom: spacing.s8 },
  columns: { gap: spacing.s3 },
  photoCard: { flex: 1, gap: spacing.s1 },
  photo: {
    width: '100%',
    aspectRatio: 1.4,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
  },
  credit: { fontFamily: fonts.sansRegular, fontSize: fontSize.nano, color: colors.secondary300 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontFamily: fonts.sansRegular, fontSize: fontSize.sm, color: colors.danger },
  empty: {
    paddingTop: spacing.s8,
    textAlign: 'center',
    fontFamily: fonts.sansRegular,
    color: colors.secondary300,
  },
});
