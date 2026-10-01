import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useCalendars, useLocales } from 'expo-localization';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '@/constants/theme';
import { usePlaceLanguage } from '@/hooks/use-place-details';
import { useExploreFeed } from '@/hooks/use-explore-feed';
import { useExploreSearch } from '@/hooks/use-explore-search';
import type { ExploreMode, ExplorePlace } from '@/types/explore';
import { PlacesStatus } from '@/components/explore/PlacesStatus';
import { PlacesButton, ui } from '@/components/explore/PlacesUI';
import { DestinationCard } from '@/components/explore/DestinationCard';
import { FeaturedDestinationCard } from '@/components/explore/FeaturedDestinationCard';
import { ExploreAreaPicker } from '@/components/explore/ExploreAreaPicker';
import { PlacesAttribution } from '@/components/explore/PlacesAttribution';

import { formatAreaLabel } from '@/utils/country-names';
import { useExploreArea } from '@/hooks/use-explore-area';
import { ManualExploreArea, useExploreUiStore } from '@/store/exploreUIStore';

const reasonKeys = {
  new_cities: 'dynamicExplore.newCities',
  nearby_cities: 'dynamicExplore.nearbyCities',
  for_trip: 'dynamicExplore.forTrip',
  based_on_history: 'dynamicExplore.basedOnHistory',
  popular_in_area: 'dynamicExplore.popularInArea',
} as const;

export default function ExploreScreen() {
  const { query, queryKey } = useLocalSearchParams<{
    query?: string;
    queryKey?: string;
  }>();

  return <ExploreContent initialQuery={query} initialQueryKey={queryKey} />;
}

function ExploreContent({
  initialQuery,
  initialQueryKey,
}: {
  initialQuery?: string;
  initialQueryKey?: string;
}) {
  const { t } = useTranslation();
  const languageCode = usePlaceLanguage();
  const focused = useIsFocused();

  const locales = useLocales();
  const calendars = useCalendars();

  const fallbackCountryCode = locales[0]?.regionCode ?? undefined;
  const timeZone = calendars[0]?.timeZone ?? 'UTC';

  const draft = useExploreUiStore((state) => state.draft);
  const submitted = useExploreUiStore((state) => state.submitted);
  const mode = useExploreUiStore((state) => state.mode);
  const manualArea = useExploreUiStore((state) => state.manualArea);
  const lastRouteKey = useExploreUiStore((state) => state.lastRouteKey);

  const routeKey = initialQuery ? JSON.stringify([initialQueryKey ?? null, initialQuery]) : null;

  const pendingInitial =
    !!initialQuery && initialQuery.trim().length >= 3 && routeKey !== lastRouteKey;

  const query = pendingInitial ? initialQuery! : draft;
  const submittedQuery = pendingInitial ? initialQuery!.trim() : submitted;

  const queryEmpty = submittedQuery === '';

  const [pickerOpen, setPickerOpen] = useState(false);
  const [visiblePhotos, setVisiblePhotos] = useState(() => new Set<string>());
  const [featuredVisible, setFeaturedVisible] = useState(true);

  const listRef = useRef<FlatList<ExplorePlace>>(null);
  const restoredList = useRef<string | null>(null);

  useEffect(() => {
    if (!pendingInitial || !initialQuery) return;

    useExploreUiStore.setState({
      draft: initialQuery,
      submitted: initialQuery.trim(),
      lastRouteKey: routeKey,
      scroll: null,
    });
  }, [initialQuery, pendingInitial, routeKey]);

  // En la pantalla inicial Discover ya obtiene recomendaciones y zona.
  const feed = useExploreFeed({
    mode,
    languageCode,
    area: manualArea?.value,
    fallbackCountryCode,
    timeZone,
    enabled: focused && queryEmpty,
  });

  // Solo necesitamos una resolución independiente al buscar
  // o cuando ha fallado el descubrimiento de recomendaciones.
  const areaContext = useExploreArea({
    languageCode,
    area: manualArea?.value,
    fallbackCountryCode,
    timeZone,
    enabled: focused && (!queryEmpty || !!feed.error),
  });

  const resolvedArea = areaContext.area ?? feed.area;

  const search = useExploreSearch(
    languageCode,
    mode,
    resolvedArea,
    focused && !queryEmpty && !!resolvedArea,
  );

  useEffect(() => {
    if (!focused || !resolvedArea || !submittedQuery) return;

    search.ensure(submittedQuery);
  }, [focused, resolvedArea, submittedQuery, search]);

  const changeText = (text: string) => {
    useExploreUiStore.setState({
      draft: text,
      ...(text.trim() === '' ? { submitted: '', scroll: null } : {}),
    });

    if (text.trim() === '') {
      search.reset();
    }
  };

  const submitSearch = () => {
    const clean = query.trim();

    if (clean.length < 3 || !resolvedArea) return;

    if (clean !== submittedQuery) {
      useExploreUiStore.setState({
        submitted: clean,
        scroll: null,
      });
    } else {
      search.ensure(clean);
    }
  };

  const changeMode = (value: ExploreMode) => {
    if (value === mode) return;

    search.reset();
    setVisiblePhotos(new Set());

    useExploreUiStore.setState({
      mode: value,
      scroll: null,
    });
  };

  const setManualArea = (value: ManualExploreArea | null) => {
    search.reset();
    setVisiblePhotos(new Set());

    useExploreUiStore.setState({
      manualArea: value,
      scroll: null,
    });
  };

  const openPlace = (placeId: string) => {
    router.push({ pathname: '/places/[placeId]', params: { placeId } });
  };

  const featured = queryEmpty ? (feed.places[0] ?? null) : null;
  const cards = queryEmpty ? feed.places.slice(1) : search.places;

  const listKey = JSON.stringify([
    languageCode,
    mode,
    resolvedArea,
    queryEmpty ? 'feed' : submittedQuery,
  ]);

  useEffect(() => {
    restoredList.current = null;
  }, [listKey]);

  const restoreScroll = () => {
    if (restoredList.current === listKey || (cards.length === 0 && !featured)) {
      return;
    }

    restoredList.current = listKey;

    const saved = useExploreUiStore.getState().scroll;
    const offset = saved?.key === listKey ? saved.offset : 0;

    listRef.current?.scrollToOffset({
      offset,
      animated: false,
    });

    setFeaturedVisible(offset < 340);
  };

  const areaLabel = formatAreaLabel(
    manualArea?.label,
    resolvedArea?.label,
    fallbackCountryCode,
    languageCode,
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<ExplorePlace>[] }) => {
      setVisiblePhotos(
        new Set(
          viewableItems.filter((token) => token.isViewable).map((token) => token.item.placeId),
        ),
      );
    },
    [],
  );

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.y;

    setFeaturedVisible(offset < 340);

    if (restoredList.current === listKey) {
      useExploreUiStore.setState({
        scroll: { key: listKey, offset },
      });
    }
  };

  const searchStatus = !resolvedArea ? (
    <PlacesStatus
      loading={areaContext.loading}
      error={areaContext.error}
      onRetry={areaContext.error ? areaContext.retry : undefined}
    />
  ) : (
    <>
      {query.trim().length < 3 ? (
        <PlacesStatus message={t('places.minQuery')} />
      ) : !search.searched && !search.loading ? (
        <PlacesStatus message={t('dynamicExplore.searchHint')} />
      ) : null}

      <PlacesStatus
        loading={search.loading}
        error={search.error}
        message={
          search.searched && !search.loading && !search.error && search.places.length === 0
            ? t('places.noResults')
            : undefined
        }
        onRetry={search.error ? search.retry : undefined}
      />
    </>
  );

  const status = queryEmpty ? (
    <>
      {feed.partial && <PlacesStatus message={t('dynamicExplore.partial')} />}
      {feed.error && feed.places.length > 0 && (
        <PlacesStatus
          error={feed.error}
          message={t('dynamicExplore.refreshFailed')}
          onRetry={feed.refresh}
        />
      )}
      {feed.loading && (
        <View style={styles.skeletons} accessibilityLabel={t('fixes.loading')}>
          <View style={styles.skeletonHero} />
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonCard} />
            <View style={styles.skeletonCard} />
          </View>
        </View>
      )}
      {!feed.loading && feed.error && feed.places.length === 0 && (
        <PlacesStatus error={feed.error} onRetry={feed.refresh} />
      )}
      {!feed.loading && !feed.error && feed.area && feed.places.length === 0 && (
        <View style={{ gap: 10 }}>
          <PlacesStatus
            message={t(
              mode === 'cities' ? 'dynamicExplore.emptyCities' : 'dynamicExplore.emptyPlaces',
            )}
          />
          <PlacesButton
            title={t('dynamicExplore.changeArea')}
            onPress={() => setPickerOpen(true)}
          />
        </View>
      )}
    </>
  ) : (
    searchStatus
  );

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
                onPress={() => changeMode(value)}
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
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          onSubmitEditing={submitSearch}
        />
        {!!query.trim() && (
          <PlacesButton
            title={t('places.search')}
            disabled={query.trim().length < 3 || search.loading || !resolvedArea}
            onPress={submitSearch}
          />
        )}
        <View style={styles.areaRow}>
          <Text numberOfLines={1} style={styles.areaText}>
            {t('dynamicExplore.exploringIn', { area: areaLabel })}
          </Text>
          <PlacesButton
            title={t('dynamicExplore.changeArea')}
            secondary
            onPress={() => setPickerOpen(true)}
          />
        </View>
      </View>
      <FlatList
        ref={listRef}
        key={listKey}
        onContentSizeChange={restoreScroll}
        data={cards}
        numColumns={2}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(place) => place.placeId}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={queryEmpty ? feed.refreshing : search.loading}
            onRefresh={queryEmpty ? feed.refresh : search.retry}
          />
        }
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 10 }}
        onScroll={onScroll}
        scrollEventThrottle={80}
        renderItem={({ item, index }) => (
          <DestinationCard
            place={item}
            onPress={() => openPlace(item.placeId)}
            style={styles.gridCard}
            photoEnabled={
              focused &&
              (visiblePhotos.has(item.placeId) || (visiblePhotos.size === 0 && index < 4))
            }
          />
        )}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            {queryEmpty && feed.reason && feed.places.length > 0 && (
              <Text style={styles.reason}>{t(reasonKeys[feed.reason])}</Text>
            )}
            {queryEmpty && featured && (
              <FeaturedDestinationCard
                place={featured}
                onPress={() => openPlace(featured.placeId)}
                photoEnabled={focused && featuredVisible}
              />
            )}
            {queryEmpty && cards.length > 0 && (
              <Text style={styles.sectionTitle}>
                {mode === 'cities'
                  ? t('dynamicExplore.newCities')
                  : t('dynamicExplore.popularInArea')}
              </Text>
            )}
            {((queryEmpty && feed.places.length > 0) ||
              (!queryEmpty && search.places.length > 0)) && <PlacesAttribution showGoogle />}
            {status}
          </View>
        }
        ListFooterComponent={
          !queryEmpty && search.nextPageToken && !search.error ? (
            <View style={styles.footer}>
              <PlacesButton
                title={t('places.loadMore')}
                disabled={search.loading}
                onPress={search.loadMore}
              />
            </View>
          ) : null
        }
      />
      <ExploreAreaPicker
        open={pickerOpen}
        languageCode={languageCode}
        onClose={() => setPickerOpen(false)}
        onAutomatic={() => setManualArea(null)}
        onChange={(value, label) => setManualArea({ value, label })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 25, paddingBottom: 120, gap: 20 },
  columns: { justifyContent: 'space-between', gap: 16 },
  gridCard: { width: '47%' },
  headerContent: { gap: 16, marginBottom: 16 },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  areaText: { flex: 1, fontFamily: fonts.sansRegular, color: colors.secondary300, fontSize: 12 },
  reason: { fontFamily: fonts.sansSemiBold, color: colors.secondary300, fontSize: 13 },
  sectionTitle: {
    fontFamily: fonts.serifItalic,
    fontSize: 30,
    color: colors.secondary,
    marginTop: 8,
  },
  footer: { paddingTop: 16 },
  skeletons: { gap: 18 },
  skeletonHero: { height: 206, borderRadius: 16, backgroundColor: colors.surfaceAlt },
  skeletonRow: { flexDirection: 'row', gap: 16 },
  skeletonCard: { flex: 1, height: 190, borderRadius: 16, backgroundColor: colors.surfaceAlt },
});
