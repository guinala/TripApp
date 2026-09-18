import { LoadNotice } from '@/components/ui/LoadNotice';
import { accountVersion, assertAccount } from '@/services/account-session';
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
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useTripDetail } from '@/context/TripDetailContext';
import { useAuthStore } from '@/store/authStore';
import { usePhotoStore } from '@/store/photoStore';
import { useDiaryPhotos, type DiaryPhoto } from '@/hooks/use-diary-photos';
import {
  pickPhotoFromLibrary,
  takePhotoWithCamera,
  uploadPhotoFile,
  type PickedPhoto,
} from '@/utils/photoUpload';
import { exportDiaryToPdf } from '@/utils/exportDiaryPdf';
import { DiaryViewSelector } from '@/components/diary/DiaryViewSelector';
import { DiaryDayHeader } from '@/components/diary/DiaryDayHeader';
import { PhotoMosaic, type MosaicPhoto } from '@/components/diary/PhotoMosaic';
import { TimelinePhotoItem } from '@/components/diary/TimelinePhotoItem';
import { DiaryMap } from '@/components/diary/DiaryMap';
import { DayPickerModal } from '@/components/diary/DayPickerModal';
import { Fab } from '@/components/ui/Fab';
import type { DiaryView } from '@/constants/diary';

const SCREEN_PADDING = spacing.s5;

function toMosaicPhoto(photo: DiaryPhoto, locationLabel?: string | null): MosaicPhoto {
  return { id: photo.id, url: photo.url, locationLabel };
}

export default function DiaryScreen() {
  const { t } = useTranslation();
  const { trip, days } = useTripDetail();
  const userId = useAuthStore((s) => s.user?.id);
  const addPhoto = usePhotoStore((s) => s.addPhoto);

  const { photos, groups, loading, urlsLoading, error, loaded, retry } = useDiaryPhotos(
    trip.id,
    days,
  );
  const [view, setView] = useState<DiaryView>('grid');
  const [uploading, setUploading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<PickedPhoto | null>(null);
  const [dayPickerVisible, setDayPickerVisible] = useState(false);

  const { width } = useWindowDimensions();
  const mosaicWidth = width - SCREEN_PADDING * 2;

  const uploadAndSavePhoto = useCallback(
    async (photo: PickedPhoto, dayId: string | null) => {
      if (!userId) return;
      const started = accountVersion();
      setUploading(true);
      try {
        const path = await uploadPhotoFile(userId, trip.id, photo.base64);
        assertAccount(started);
        await addPhoto({
          tripId: trip.id,
          dayId,
          uri: path,
          location: photo.location,
          takenAt: photo.takenAt ?? undefined,
        });
      } catch {
        Alert.alert(t('diary.addPhotoError'), t('common.tryAgain'));
      } finally {
        setUploading(false);
      }
    },
    [userId, trip.id, addPhoto, t],
  );

  const handleSelectDay = useCallback(
    async (dayId: string) => {
      if (!pendingPhoto) return;
      const photo = pendingPhoto;
      setDayPickerVisible(false);
      setPendingPhoto(null);
      await uploadAndSavePhoto(photo, dayId);
    },
    [pendingPhoto, uploadAndSavePhoto],
  );

  const handleCloseDayPicker = useCallback(() => {
    setDayPickerVisible(false);
    setPendingPhoto(null);
  }, []);

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
      const picked = useCamera ? await takePhotoWithCamera() : await pickPhotoFromLibrary();
      if (!picked) return;

      if (days.length === 0) {
        await uploadAndSavePhoto(picked, null);
        return;
      }

      if (days.length === 1) {
        await uploadAndSavePhoto(picked, days[0].id);
        return;
      }

      setPendingPhoto(picked);
      setDayPickerVisible(true);
    } catch {
      Alert.alert(t('diary.addPhotoError'), t('common.tryAgain'));
    }
  }, [userId, days, uploadAndSavePhoto, t]);

  const handlePressPhoto = useCallback(
    (photoId: string) => {
      router.push(`/trips/${trip.id}/photo/${photoId}`);
    },
    [trip.id],
  );

  const handleExportPdf = useCallback(async () => {
    if (error || loading || urlsLoading || !loaded) {
      retry();
      return;
    }
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
    } catch (e) {
      Alert.alert(t('diary.exportError'), e instanceof Error ? e.message : t('common.tryAgain'));
    } finally {
      setExportingPdf(false);
    }
  }, [groups, trip, t, error, loading, urlsLoading, loaded, retry]);

  if ((loading || urlsLoading) && groups.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LoadNotice error={error} onRetry={retry} />
        <DiaryViewSelector
          active={view}
          onChange={setView}
          onExportPdf={handleExportPdf}
          exportingPdf={exportingPdf}
        />

        {error && groups.length === 0 ? null : groups.length === 0 ? (
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

      {uploading && (
        <View style={styles.uploadingToast}>
          <ActivityIndicator size="small" color={colors.white} />
          <Text style={styles.uploadingText}>{t('diary.uploading')}</Text>
        </View>
      )}

      <Fab
        onPress={uploading ? () => {} : handleAddPhoto}
        icon="camera"
        accessibilityLabel={t('diary.addPhoto')}
      />

      <DayPickerModal
        visible={dayPickerVisible}
        days={days}
        suggestedDate={pendingPhoto?.takenAt}
        onSelectDay={handleSelectDay}
        onClose={handleCloseDayPicker}
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
  uploadingToast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
    backgroundColor: colors.secondaryDark,
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s4,
    borderRadius: radius.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  uploadingText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
    color: colors.white,
  },
});
