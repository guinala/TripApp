import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePlaceLanguage } from '@/hooks/use-place-details';
import { usePlacesAutocomplete } from '@/hooks/use-places-autocomplete';
import { usePlaceSearch } from '@/hooks/use-place-search';
import { useEditorialDestinations } from '@/hooks/use-editorial-destinations';
import { useDestinationFilter } from '@/hooks/use-destination-filter';
import { CONTINENTS } from '@/constants/destinations';
import type { Continent } from '@/types/destination';
import { PlaceResultRow } from '@/components/explore/place-result-row';
import { PlaceSearchResults } from '@/components/explore/place-search-results';
import { PlacesStatus } from '@/components/explore/places-status';
import { PlacesButton, ui } from '@/components/explore/places-ui';
import { DestinationCard } from '@/components/explore/DestinationCard';
import { FeaturedDestinationCard } from '@/components/explore/FeaturedDestinationCard';
export default function ExploreScreen() {
  const { query, queryKey } = useLocalSearchParams<{ query?: string; queryKey?: string }>();
  return <ExploreContent key={queryKey ?? query ?? 'default'} initialQuery={query} />;
}
function ExploreContent({ initialQuery }: { initialQuery?: string }) {
  const { t } = useTranslation(),
    languageCode = usePlaceLanguage();
  const [query, setQuery] = useState(initialQuery ?? '');
  const [mode, setMode] = useState<'cities' | 'places'>('cities');
  const [continent, setContinent] = useState<Continent | null>(null);
  const focused = useIsFocused();
  const selectionVersion = useRef(0);
  const cities = usePlacesAutocomplete({
    scope: 'destinations',
    languageCode,
    enabled: focused && mode === 'cities',
  });
  const search = usePlaceSearch(languageCode);
  const editorial = useEditorialDestinations();
  const filtered = useDestinationFilter(editorial.destinations, continent);
  const invalidateSelection = useCallback(() => {
    selectionVersion.current++;
  }, []);
  useEffect(() => {
    invalidateSelection();
    return invalidateSelection;
  }, [mode, languageCode, focused, invalidateSelection]);
  const changeText = (text: string) => {
    selectionVersion.current++;
    setQuery(text);
    search.reset();
    cities.changeQuery(mode === 'cities' ? text : '');
  };
  const select = async (id: string) => {
    const own = ++selectionVersion.current;
    try {
      const place = await cities.selectPlace(id);
      if (own === selectionVersion.current)
        router.push({ pathname: '/places/[placeId]', params: { placeId: place.placeId } });
    } catch {
      /* El hook presenta el error. */
    }
  };
  const openEditorial = (id: string) =>
    router.push({ pathname: '/destinations/[id]', params: { id } });
  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <View style={ui.header}>
        <Text style={ui.heading}>{t('places.explore')}</Text>
        <View style={ui.row}>
          {(['cities', 'places'] as const).map((value) => (
            <View key={value} style={{ flex: 1 }}>
              <PlacesButton
                title={t(`places.modes.${value}`)}
                secondary={mode !== value}
                onPress={() => {
                  selectionVersion.current++;
                  cities.cancelSearch();
                  search.reset();
                  setMode(value);
                }}
              />
            </View>
          ))}
        </View>
        <TextInput
          accessibilityLabel={t('places.searchPlaceholder')}
          style={ui.input}
          value={query}
          onChangeText={changeText}
          placeholder={t('places.searchPlaceholder')}
          returnKeyType="search"
          onSubmitEditing={() =>
            mode === 'places' ? search.search(query) : cities.changeQuery(query)
          }
        />
        {!!query.trim() && (
          <PlacesButton
            title={t('places.search')}
            disabled={query.trim().length < 3 || search.loading || cities.selecting}
            onPress={() => (mode === 'places' ? search.search(query) : cities.changeQuery(query))}
          />
        )}
        {!!query.trim() && query.trim().length < 3 && (
          <Text style={ui.text}>{t('places.minQuery')}</Text>
        )}
        {!!query.trim() && mode === 'cities' && (
          <PlacesStatus
            loading={cities.loading || cities.selecting}
            error={cities.error}
            onRetry={cities.error ? cities.retrySearch : undefined}
          />
        )}
      </View>
      {!query.trim() ? (
        <FlatList
          key="editorial-grid"
          data={filtered.rest}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={ui.body}
          renderItem={({ item }) => (
            <DestinationCard
              destination={item}
              onPress={() => openEditorial(item.id)}
              style={{ flex: 1, maxWidth: '49%' }}
            />
          )}
          ListHeaderComponent={
            <View style={{ gap: 16, marginBottom: 16 }}>
              <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>
                <PlacesButton
                  title={t('places.allContinents')}
                  secondary={continent !== null}
                  onPress={() => setContinent(null)}
                />
                {CONTINENTS.map((value) => (
                  <PlacesButton
                    key={value}
                    title={t(`places.continents.${value}`)}
                    secondary={continent !== value}
                    onPress={() => setContinent(value)}
                  />
                ))}
              </ScrollView>
              <PlacesStatus
                loading={editorial.loading}
                error={editorial.error}
                onRetry={editorial.error ? editorial.retry : undefined}
              />
              {filtered.featured && (
                <FeaturedDestinationCard
                  destination={filtered.featured}
                  onPress={() => openEditorial(filtered.featured!.id)}
                />
              )}
            </View>
          }
          ListEmptyComponent={
            !editorial.loading && !editorial.error && !filtered.featured ? (
              <PlacesStatus message={t('places.noRecommendations')} />
            ) : null
          }
        />
      ) : mode === 'cities' ? (
        <View style={{ flex: 1 }}>
          {query.trim().length >= 3 &&
            !cities.loading &&
            !cities.selecting &&
            !cities.error &&
            cities.suggestions.length === 0 && (
              <PlacesStatus
                message={t(cities.searched ? 'places.noResults' : 'places.searchHint')}
              />
            )}
          <PlaceSearchResults
            suggestions={cities.suggestions}
            selecting={cities.selecting}
            onSelect={(id) => {
              void select(id);
            }}
          />
        </View>
      ) : (
        <FlatList
          key="remote-list"
          keyboardShouldPersistTaps="handled"
          data={search.places}
          keyExtractor={(item) => item.placeId}
          contentContainerStyle={ui.body}
          renderItem={({ item }) => (
            <PlaceResultRow
              place={item}
              onPress={() =>
                router.push({ pathname: '/places/[placeId]', params: { placeId: item.placeId } })
              }
            />
          )}
          ListFooterComponent={
            <View style={{ gap: 12 }}>
              <PlacesStatus
                loading={search.loading}
                error={search.error}
                message={
                  search.searched && !search.loading && !search.error && !search.places.length
                    ? t('places.noResults')
                    : undefined
                }
                onRetry={search.error ? search.retry : undefined}
              />
              {search.nextPageToken && !search.error && (
                <PlacesButton
                  title={t('places.loadMore')}
                  disabled={search.loading}
                  onPress={search.loadMore}
                />
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
