import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ImageZoom } from '@likashefqet/react-native-image-zoom';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { usePhotoStore } from '@/store/photoStore';
import { useSignedUrls } from '@/hooks/use-signed-urls';
import { LocationPickerModal } from '@/components/diary/LocationPickerModal';
import { regionForPoints, type LatLng } from '@/utils/mapRegion';
import type { Photo } from '@/types/photo';

export default function PhotoViewerScreen() {
  const { id: tripId, photoId } = useLocalSearchParams<{ id: string; photoId: string }>();

  const photos = usePhotoStore((s) => s.byTrip[tripId] ?? []);
  const editPhoto = usePhotoStore((s) => s.editPhoto);
  const removePhoto = usePhotoStore((s) => s.removePhoto);

  const orderedPhotos = useMemo(
    () => [...photos].sort((a, b) => a.takenAt.localeCompare(b.takenAt)),
    [photos],
  );
  const initialIndex = Math.max(
    orderedPhotos.findIndex((p) => p.id === photoId),
    0,
  );

  const paths = useMemo(() => orderedPhotos.map((p) => p.uri), [orderedPhotos]);
  const { urls } = useSignedUrls(paths);

  const pagerRef = useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const activePhoto = orderedPhotos[activeIndex] as Photo | undefined;

  const [editingCaption, setEditingCaption] = useState(false);
  const [draftCaption, setDraftCaption] = useState(activePhoto?.caption ?? '');
  const [saving, setSaving] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);

  const fallbackRegion = useMemo(
    () =>
      regionForPoints(
        orderedPhotos
          .filter((p): p is Photo & { location: LatLng } => p.location != null)
          .map((p) => p.location),
      ),
    [orderedPhotos],
  );

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(`/trips/${tripId}`);
  }, [tripId]);

  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const next = e.nativeEvent.position;
      setActiveIndex(next);
      setEditingCaption(false);
      setDraftCaption(orderedPhotos[next]?.caption ?? '');
    },
    [orderedPhotos],
  );

  const handleSaveCaption = useCallback(async () => {
    if (!activePhoto) return;
    const next = draftCaption.trim();
    setEditingCaption(false);
    if (next === (activePhoto.caption ?? '')) return;

    setSaving(true);
    try {
      await editPhoto(tripId, activePhoto.id, { caption: next || null });
    } catch {
      Alert.alert('No se pudo guardar', 'Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }, [activePhoto, draftCaption, editPhoto, tripId]);

  const handleSaveLocation = useCallback(
    async (location: LatLng | null) => {
      if (!activePhoto) return;
      setLocationModalOpen(false);
      if (location === activePhoto.location) return;

      setSavingLocation(true);
      try {
        await editPhoto(tripId, activePhoto.id, { location });
      } catch {
        Alert.alert('No se pudo guardar la ubicación', 'Inténtalo de nuevo.');
      } finally {
        setSavingLocation(false);
      }
    },
    [activePhoto, editPhoto, tripId],
  );

  const handleShare = useCallback(async () => {
    const url = activePhoto ? urls.get(activePhoto.uri) : null;
    if (!url) return;

    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert('No disponible', 'Compartir no está disponible en este dispositivo.');
      return;
    }
    try {
      await Sharing.shareAsync(url);
    } catch {
      // el usuario canceló el share sheet; no hace falta avisar
    }
  }, [activePhoto, urls]);

  const handleDelete = useCallback(() => {
    if (!activePhoto) return;
    Alert.alert('Eliminar foto', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await removePhoto(tripId, activePhoto);
            if (orderedPhotos.length <= 1) close();
            else close();
          } catch {
            Alert.alert('No se pudo eliminar', 'Inténtalo de nuevo.');
          }
        },
      },
    ]);
  }, [activePhoto, orderedPhotos.length, removePhoto, tripId, close]);

  if (orderedPhotos.length === 0) {
    return (
      <View style={styles.emptyScreen}>
        <Text style={styles.emptyText}>Esta foto ya no está disponible.</Text>
        <Pressable onPress={close} style={styles.emptyBtn}>
          <Text style={styles.emptyBtnText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialIndex}
        onPageSelected={handlePageSelected}
      >
        {orderedPhotos.map((photo) => {
          const url = urls.get(photo.uri);
          return (
            <View key={photo.id} style={styles.page}>
              {url ? (
                <ImageZoom
                  uri={url}
                  style={styles.image}
                  minScale={1}
                  maxScale={4}
                  isDoubleTapEnabled
                />
              ) : (
                <View style={styles.loadingPage}>
                  <ActivityIndicator color={colors.surfacePaper} />
                </View>
              )}
            </View>
          );
        })}
      </PagerView>

      <SafeAreaView style={styles.topBar} edges={['top']} pointerEvents="box-none">
        <Pressable style={styles.iconBtn} onPress={close} hitSlop={10}>
          <Ionicons name="close" size={24} color={colors.surfacePaper} />
        </Pressable>

        <View style={styles.topActions}>
          <Pressable style={styles.iconBtn} onPress={handleShare} hitSlop={10}>
            <Ionicons name="share-outline" size={22} color={colors.surfacePaper} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={handleDelete} hitSlop={10}>
            <Ionicons name="trash-outline" size={22} color={colors.surfacePaper} />
          </Pressable>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.bottomBar}
      >
        <SafeAreaView edges={['bottom']}>
          {activePhoto?.takenAt ? (
            <Text style={styles.dateText}>
              {format(parseISO(activePhoto.takenAt), "d 'de' MMMM, HH:mm", { locale: es })}
            </Text>
          ) : null}

          {editingCaption ? (
            <TextInput
              style={styles.captionInput}
              value={draftCaption}
              onChangeText={setDraftCaption}
              placeholder="Añade una nota..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              autoFocus
              multiline
              onBlur={handleSaveCaption}
              onSubmitEditing={handleSaveCaption}
            />
          ) : (
            <Pressable onPress={() => setEditingCaption(true)}>
              <Text
                style={[styles.captionText, !activePhoto?.caption && styles.captionPlaceholder]}
              >
                {activePhoto?.caption || 'Añade una nota...'}
              </Text>
            </Pressable>
          )}

          <Pressable style={styles.locationRow} onPress={() => setLocationModalOpen(true)}>
            <Ionicons
              name={activePhoto?.location ? 'location' : 'location-outline'}
              size={16}
              color="rgba(255,255,255,0.85)"
            />
            <Text style={styles.locationText}>
              {activePhoto?.location ? 'Ubicación guardada' : 'Añadir ubicación'}
            </Text>
            {savingLocation ? <ActivityIndicator size="small" color={colors.surfacePaper} /> : null}
          </Pressable>

          {saving ? <ActivityIndicator size="small" color={colors.surfacePaper} /> : null}
        </SafeAreaView>
      </KeyboardAvoidingView>

      <LocationPickerModal
        visible={locationModalOpen}
        initialLocation={activePhoto?.location ?? null}
        fallbackRegion={fallbackRegion}
        resetKey={activePhoto?.id}
        onClose={() => setLocationModalOpen(false)}
        onConfirm={handleSaveLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  pager: { flex: 1 },
  page: { flex: 1, justifyContent: 'center' },
  image: { flex: 1 },
  loadingPage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyScreen: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s4,
  },
  emptyText: { fontFamily: fonts.sansRegular, color: colors.surfacePaper },
  emptyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
  },
  emptyBtnText: { fontFamily: fonts.sansBold, color: colors.surfacePaper },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4,
    paddingTop: spacing.s2,
  },
  topActions: { flexDirection: 'row', gap: spacing.s3 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s3,
  },
  dateText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.label,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.s1,
  },
  captionText: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.base,
    color: colors.surfacePaper,
    paddingBottom: spacing.s4,
  },
  captionPlaceholder: { color: 'rgba(255,255,255,0.5)' },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
    paddingBottom: spacing.s2,
  },
  locationText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
  },
  captionInput: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.base,
    color: colors.surfacePaper,
    paddingBottom: spacing.s4,
    minHeight: 40,
  },
});
