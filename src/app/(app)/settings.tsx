import { LoadNotice } from '@/components/ui/LoadNotice';
import { accountVersion, assertAccount } from '@/services/account-session';
import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { colors, fonts } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { useUIStore } from '@/store/uiStore';
import { CURRENCIES } from '@/constants/currencies';
import { Toggle } from '@/components/ui/Toggle';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { useTripStore } from '@/store/tripStore';
import {
  ensureNotificationPermissions,
  resyncNotifications,
  useNotificationStatus,
} from '@/services/notifications';
import { File, Paths } from 'expo-file-system';
import { exportUserData } from '@/services/dataExport';
import { syncLanguage } from '@/i18n';
import { format } from 'date-fns';
import * as Sharing from 'expo-sharing';
import { supabase } from '@/services/supabase';

import { OptionPickerModal, type PickerOption } from '@/components/ui/OptionPickerModal';

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

const LANGUAGE_OPTIONS: PickerOption[] = LANGUAGES.map((l) => ({
  label: l.label,
  value: l.code,
}));

const CURRENCY_OPTIONS: PickerOption[] = CURRENCIES.map((c) => ({
  label: `${c.code} (${c.symbol})`,
  value: c.code,
}));

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.update);
  const clearProfile = useProfileStore((s) => s.clear);
  const trips = useTripStore((s) => s.trips);

  const [exporting, setExporting] = useState(false);
  const notificationError = useNotificationStatus((s) => s.error);

  const ui = useUIStore();

  const selectedCurrency = CURRENCIES.find((c) => c.code === profile?.defaultCurrency);
  const currencyLabel = selectedCurrency
    ? `${selectedCurrency.code} (${selectedCurrency.symbol})`
    : (profile?.defaultCurrency ?? '—');
  const languageLabel =
    LANGUAGES.find((l) => l.code === profile?.preferredLanguage)?.label ?? 'Español';

  const performDelete = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('delete-user');
    if (error || data?.status !== 'pending') {
      Alert.alert(t('common.error'), t('settings.deleteAccount.error'));
      return;
    }
    // Bloquear la app de inmediato aunque falle después la salida local.
    const current = useProfileStore.getState().profile;
    if (current)
      useProfileStore.setState({
        profile: { ...current, deletionRequestedAt: new Date().toISOString() },
      });
    Alert.alert(t('settings.deleteAccount.title'), t('fixes.accountPending'));
    try {
      await signOut();
    } catch {
      /* AccountBoundary conserva la pantalla de borrado pendiente. */
    }
  }, [signOut, t]);

  const handleExport = useCallback(async () => {
    if (!user || exporting) return;
    setExporting(true);
    try {
      const started = accountVersion();
      const data = await exportUserData(user.id);
      assertAccount(started);
      if (Platform.OS === 'web') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'tripmate-export.json';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
        return;
      }
      if (!(await Sharing.isAvailableAsync())) throw new Error('SHARING_UNAVAILABLE');
      const file = new File(
        Paths.cache,
        `tripmate-export-${format(new Date(), 'yyyy-MM-dd')}.json`,
      );
      if (file.exists) file.delete();
      file.create();
      file.write(JSON.stringify(data, null, 2));
      try {
        assertAccount(started);
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: t('settings.export.dialogTitle'),
        });
      } finally {
        if (file.exists) file.delete();
      }
    } catch {
      Alert.alert(t('common.error'), t('settings.export.error'));
    } finally {
      setExporting(false);
    }
  }, [user, exporting, t]);

  const handleToggleNotif = useCallback(
    async (
      key: 'notifTripReminders' | 'notifBudgetSummary' | 'notifWeeklyInspiration',
      value: boolean,
    ) => {
      if (value) {
        const ok = await ensureNotificationPermissions();
        if (!ok) {
          Alert.alert(t('common.permissionNeeded'), t('settings.notifications.permissionMessage'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('settings.notifications.openSettings'),
              onPress: () => Linking.openSettings(),
            },
          ]);
          return;
        }
      }
      ui.setNotif(key, value);
      const s = useUIStore.getState();
      await resyncNotifications(trips, {
        tripReminders: s.notifTripReminders,
        budgetSummary: s.notifBudgetSummary,
        weeklyInspiration: s.notifWeeklyInspiration,
      }).catch(() => Alert.alert(t('common.error'), t('fixes.notificationsError')));
    },
    [trips, ui, t],
  );

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(t('settings.deleteAccount.title'), t('settings.deleteAccount.warning'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.continue'),
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            t('settings.deleteAccount.confirmTitle'),
            t('settings.deleteAccount.confirmMessage'),
            [
              { text: t('settings.deleteAccount.keep'), style: 'cancel' },
              {
                text: t('settings.deleteAccount.confirm'),
                style: 'destructive',
                onPress: performDelete,
              },
            ],
          ),
      },
    ]);
  }, [performDelete, t]);

  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  const handleSelectLanguage = useCallback(
    async (code: string) => {
      if (!user) return;
      try {
        await updateProfile(user.id, { preferredLanguage: code });
        syncLanguage(code);
      } catch {
        Alert.alert(t('common.error'), t('common.tryAgain'));
      }
    },
    [user, updateProfile, t],
  );

  const handleSelectCurrency = useCallback(
    async (code: string) => {
      if (!user) return;
      try {
        await updateProfile(user.id, { defaultCurrency: code });
      } catch {
        Alert.alert(t('common.error'), t('common.tryAgain'));
      }
    },
    [user, updateProfile, t],
  );

  const pickLanguage = useCallback(() => {
    setLanguageModalVisible(true);
  }, []);

  const pickCurrency = useCallback(() => {
    setCurrencyModalVisible(true);
  }, []);

  const confirmSignOut = useCallback(() => {
    Alert.alert(t('settings.signOut.title'), t('settings.signOut.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.signOut.title'),
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            clearProfile();
          } catch {
            Alert.alert(t('common.error'), t('common.tryAgain'));
          }
        },
      },
    ]);
  }, [signOut, clearProfile, t]);

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsSection label={t('settings.sections.preferences')}>
          <SettingsRow
            title={t('settings.language.title')}
            value={languageLabel}
            variant="chevron"
            onPress={pickLanguage}
          />
          <SettingsRow
            title={t('settings.currency.row')}
            value={currencyLabel}
            variant="chevron"
            onPress={pickCurrency}
          />
        </SettingsSection>

        <LoadNotice
          error={notificationError}
          message={notificationError ? t('fixes.notificationsError') : undefined}
          onRetry={() => {
            void resyncNotifications(trips, {
              tripReminders: ui.notifTripReminders,
              budgetSummary: ui.notifBudgetSummary,
              weeklyInspiration: ui.notifWeeklyInspiration,
            }).catch(() => {});
          }}
        />
        <SettingsSection label={t('settings.sections.notifications')}>
          <SettingsRow
            title={t('settings.notifications.tripReminders')}
            subtitle={t('settings.notifications.tripRemindersSubtitle')}
            right={
              <Toggle
                value={ui.notifTripReminders}
                onValueChange={(v) => handleToggleNotif('notifTripReminders', v)}
              />
            }
          />
          <SettingsRow
            title={t('settings.notifications.budgetSummary')}
            subtitle={t('settings.notifications.budgetSummarySubtitle')}
            right={
              <Toggle
                value={ui.notifBudgetSummary}
                onValueChange={(v) => handleToggleNotif('notifBudgetSummary', v)}
              />
            }
          />
          <SettingsRow
            title={t('settings.notifications.weeklyInspiration')}
            right={
              <Toggle
                value={ui.notifWeeklyInspiration}
                onValueChange={(v) => handleToggleNotif('notifWeeklyInspiration', v)}
              />
            }
          />
        </SettingsSection>

        <SettingsSection label={t('settings.sections.privacy')}>
          <SettingsRow
            title={t('settings.export.row')}
            variant="external"
            subtitle={exporting ? t('settings.export.preparing') : undefined}
            onPress={handleExport}
          />
          <SettingsRow
            title={t('settings.deleteAccount.title')}
            variant="danger"
            onPress={handleDeleteAccount}
          />
        </SettingsSection>

        <Pressable style={styles.signOutButton} onPress={confirmSignOut}>
          <Text style={styles.signOutText}>{t('settings.signOut.title')}</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>TripMate v{version}</Text>
          <Text style={styles.footerText}>{t('settings.footer')}</Text>
        </View>
      </ScrollView>

      <OptionPickerModal
        visible={languageModalVisible}
        title={t('settings.language.title')}
        subtitle={t('settings.language.subtitle')}
        options={LANGUAGE_OPTIONS}
        selectedValue={profile?.preferredLanguage ?? 'es'}
        onSelect={handleSelectLanguage}
        onClose={() => setLanguageModalVisible(false)}
      />

      <OptionPickerModal
        visible={currencyModalVisible}
        title={t('settings.currency.title')}
        subtitle={t('settings.currency.subtitle')}
        options={CURRENCY_OPTIONS}
        selectedValue={profile?.defaultCurrency ?? 'EUR'}
        onSelect={handleSelectCurrency}
        onClose={() => setCurrencyModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceCream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(27, 45, 79, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  content: { padding: 20, gap: 24, paddingBottom: 40 },
  signOutButton: {
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C84A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: { fontFamily: fonts.sansBold, fontSize: 14, color: '#C84A2E' },
  footer: { alignItems: 'center', gap: 4, marginTop: 8 },
  footerText: { fontFamily: fonts.mono, fontSize: 11, color: '#8A95AC' },
});
