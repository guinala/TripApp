import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { ContinentFilter } from '@/components/explore/ContinentFilter';
import { DestinationCard } from '@/components/explore/DestinationCard';
import { FeaturedDestinationCard } from '@/components/explore/FeaturedDestinationCard';
import { useDestinationFilter } from '@/hooks/use-destination-filter';
import type { Continent } from '@/types/destination';

export default function ExploreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [continent, setContinent] = useState<Continent | null>(null);

  const { featured, rest } = useDestinationFilter(query, continent);

  const openDestination = (id: string) => {
    router.push(`/destinations/${id}`);
  };

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>
        {t('explore.titleStart')}
        <Text style={styles.titleAccent}>{t('explore.titleAccent')}</Text>
      </Text>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.secondary300} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={t('explore.searchPlaceholder')}
          placeholderTextColor={colors.secondary300}
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      <ContinentFilter value={continent} onChange={setContinent} />

      {featured && (
        <FeaturedDestinationCard
          destination={featured}
          onPress={() => openDestination(featured.id)}
        />
      )}

      <Text style={styles.sectionTitle}>
        {t('explore.sectionTitleStart')}
        <Text style={styles.titleAccent}>{t('explore.sectionTitleAccent')}</Text>
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={rest}
        keyExtractor={(d) => d.id}
        numColumns={2}
        renderItem={({ item }) => (
          <DestinationCard
            destination={item}
            style={styles.gridCard}
            onPress={() => openDestination(item.id)}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={<Text style={styles.empty}>{t('explore.empty')}</Text>}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surfaceCream,
  },
  content: {
    paddingHorizontal: 25,
    paddingTop: spacing.s5,
    paddingBottom: 120,
    rowGap: 30,
  },
  column: {
    gap: 32,
  },
  gridCard: {
    flex: 1,
  },
  header: {
    gap: spacing.s6,
  },
  title: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.textMd,
    lineHeight: fontSize.textMd * 0.95 + 4,
    color: colors.textPrimary,
  },
  titleAccent: {
    color: colors.primary,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
    backgroundColor: colors.surfacePaper,
    borderWidth: 1,
    borderColor: colors.textSubtitle,
    borderRadius: radius.lg,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.textSm,
    lineHeight: fontSize.textSm * 0.95 + 4,
    color: colors.textPrimary,
  },
  empty: {
    marginTop: spacing.s8,
    textAlign: 'center',
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.body,
    color: colors.secondary300,
  },
});
