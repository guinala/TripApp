import { useCallback, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useTripDetail } from '@/context/TripDetailContext';
import { useAuthStore } from '@/store/authStore';
import { usePhotoStore } from '@/store/photoStore';
import { useDiaryPhotos, type DiaryPhoto } from '@/hooks/use-diary-photos';
import { pickPhotoFromLibrary, takePhotoWithCamera, uploadPhotoFile } from '@/utils/photoUpload';
import { exportDiaryToPdf } from '@/utils/exportDiaryPdf';
import { DiaryViewSelector } from '@/components/diary/DiaryViewSelector';
import { DiaryDayHeader } from '@/components/diary/DiaryDayHeader';
import { PhotoMosaic, type MosaicPhoto } from '@/components/diary/PhotoMosaic';
import { TimelinePhotoItem } from '@/components/diary/TimelinePhotoItem';
import { DiaryMap } from '@/components/diary/DiaryMap';
import { Fab } from '@/components/Fab';
import type { DiaryView } from '@/constants/diary';
import type { Day } from '@/types/day';

const SCREEN_PADDING = spacing.s5;

function toMosaicPhoto(photo: DiaryPhoto, locationLabel?: string | null): MosaicPhoto {
  return { id: photo.id, url: photo.uri, locationLabel };
}

function resolveDayId(days: Day[], takenAt: string | null): string | null {
  const targetDate = (takenAt ?? new Date().toISOString()).slice(0, 10);
  return days.find((d) => d.date === targetDate)?.id ?? null;
}

export default function DiaryScreen() {
  const { t } = useTranslation();
  const { trip, days } = useTripDetail();
  const userId = useAuthStore((s) => s.user?.id);
  const addPhoto = usePhotoStore((s) => s.addPhoto);

  const { photos, groups, loading } = useDiaryPhotos(trip.id, days);
  const [view, setView] = useState<DiaryView>('grid');
  const [uploading, setUploading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const { width } = useWindowDimensions();
  const mosaicWidth = width - SCREEN_PADDING * 2;

  const handleAddPhoto = useCallback(async () => {
    if (!userId) return;

    const useCamera = await new Promise<boolean | null>((resolve) => {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: [t('common.cancel'), t('diary.takePhoto'), t('diary.chooseFromGallery')],
            cancelButtonIndex: 0,
          },
          (index) => {
            if (index === 1) resolve(true);
            else if (index === 2) resolve(false);
            else resolve(null);
          },
        );
      } else {
        Alert.alert(t('diary.addPhoto'), undefined, [
          { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(null) },
          { text: t('diary.takePhoto'), onPress: () => resolve(true) },
          { text: t('diary.chooseFromGallery'), onPress: () => resolve(false) },
        ]);
      }
    });

    if (useCamera === null) return;

    try {
      setUploading(true);
      const picked = useCamera ? await takePhotoWithCamera() : await pickPhotoFromLibrary();
      if (!picked) return;

      const path = await uploadPhotoFile(userId, trip.id, picked.base64);
      await addPhoto({
        tripId: trip.id,
        dayId: resolveDayId(days, picked.takenAt),
        uri: path,
        location: picked.location,
        takenAt: picked.takenAt ?? undefined,
      });
    } catch {
      Alert.alert(t('diary.addPhotoError'), t('common.tryAgain'));
    } finally {
      setUploading(false);
    }
  }, [userId, trip.id, days, addPhoto, t]);

  const handlePressPhoto = useCallback(
    (photoId: string) => {
      router.push(`/trips/${trip.id}/photo/${photoId}`);
    },
    [trip.id],
  );

  const handleExportPdf = useCallback(async () => {
    if (groups.length === 0) {
      Alert.alert(t('diary.nothingToExport'), t('diary.nothingToExportMessage'));
      return;
    }
    setExportingPdf(true);
    try {
      await exportDiaryToPdf(
        {
          tripTitle: trip.title,
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate,
        },
        groups,
      );
    } catch {
      Alert.alert(t('diary.exportError'), t('common.tryAgain'));
    } finally {
      setExportingPdf(false);
    }
  }, [groups, trip, t]);

  if (loading && groups.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <DiaryViewSelector
          active={view}
          onChange={setView}
          onExportPdf={handleExportPdf}
          exportingPdf={exportingPdf}
        />

        {groups.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t('diary.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('diary.emptyText')}</Text>
          </View>
        ) : view === 'grid' ? (
          <View style={styles.sections}>
            {groups.map((group) => (
              <View key={group.day?.id ?? 'unassigned'} style={styles.section}>
                <DiaryDayHeader
                  day={group.day}
                  photoCount={group.photos.length}
                  destination={group.day ? trip.destination : null}
                />
                <PhotoMosaic
                  photos={group.photos.map((p, i) =>
                    toMosaicPhoto(p, i === 0 ? trip.destination : null),
                  )}
                  width={mosaicWidth}
                  onPressPhoto={(photo) => handlePressPhoto(photo.id)}
                />
              </View>
            ))}
          </View>
        ) : view === 'timeline' ? (
          <View style={styles.sections}>
            {groups.map((group) => (
              <View key={group.day?.id ?? 'unassigned'} style={styles.section}>
                <DiaryDayHeader
                  day={group.day}
                  photoCount={group.photos.length}
                  destination={group.day ? trip.destination : null}
                />
                <View style={styles.timelineList}>
                  {group.photos.map((photo) => (
                    <TimelinePhotoItem
                      key={photo.id}
                      photo={photo}
                      onPress={() => handlePressPhoto(photo.id)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.mapSection}>
            {photos.some((p) => p.location) ? (
              <DiaryMap
                photos={photos}
                onPressPhoto={(photo) => handlePressPhoto(photo.id)}
                style={styles.mapView}
              />
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>{t('diary.noLocations')}</Text>
                <Text style={styles.emptyText}>{t('diary.noLocationsText')}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Fab
        onPress={uploading ? () => {} : handleAddPhoto}
        icon="camera"
        accessibilityLabel={t('diary.addPhoto')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceCream },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceCream,
  },
  content: { padding: SCREEN_PADDING, gap: spacing.s5, paddingBottom: 120 },
  sections: { gap: spacing.s7 },
  section: { gap: spacing.s3 },
  timelineList: { gap: spacing.s4 },
  mapSection: { minHeight: 420 },
  mapView: { flex: 1, minHeight: 420 },
  empty: { alignItems: 'center', gap: spacing.s2, paddingVertical: spacing.s10 },
  emptyTitle: { fontFamily: fonts.serifItalic, fontSize: fontSize.title, color: colors.secondary },
  emptyText: {
    fontFamily: fonts.sansRegular,
    fontSize: fontSize.sm,
    color: colors.secondary300,
    textAlign: 'center',
    paddingHorizontal: spacing.s5,
  },
});
