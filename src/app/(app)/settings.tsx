import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { ensureNotificationPermissions, resyncNotifications } from '@/services/notifications';
import { File, Paths } from 'expo-file-system';
import { exportUserData } from '@/services/dataExport';
import { format } from 'date-fns';
import * as Sharing from 'expo-sharing';
import { supabase } from '@/services/supabase';

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.update);
  const clearProfile = useProfileStore((s) => s.clear);
  const trips = useTripStore((s) => s.trips);

  const [exporting, setExporting] = useState(false);

  const ui = useUIStore();

  const selectedCurrency = CURRENCIES.find((c) => c.code === profile?.defaultCurrency);
  const currencyLabel = selectedCurrency
    ? `${selectedCurrency.code} (${selectedCurrency.symbol})`
    : (profile?.defaultCurrency ?? '—');
  const languageLabel =
    LANGUAGES.find((l) => l.code === profile?.preferredLanguage)?.label ?? 'Español';

  const performDelete = useCallback(async () => {
    const { error } = await supabase.functions.invoke('delete-user');
    if (error) {
      Alert.alert('Error', 'No se pudo eliminar la cuenta. Inténtalo de nuevo.');
      return;
    }
    clearProfile();
    try {
      await signOut(); // la sesión ya es inválida en servidor; esto limpia el cliente
    } catch {
      // esperable: el usuario ya no existe; el layout redirige igual al caer la sesión
    }
  }, [clearProfile, signOut]);

  const handleExport = useCallback(async () => {
    if (!user || exporting) return;
    setExporting(true);
    try {
      const data = await exportUserData(user.id);
      const file = new File(
        Paths.cache,
        `tripmate-export-${format(new Date(), 'yyyy-MM-dd')}.json`,
      );
      if (file.exists) file.delete();
      file.create();
      file.write(JSON.stringify(data, null, 2));
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Exportar mis datos de TripMate',
      });
    } catch {
      Alert.alert('Error', 'No se pudieron exportar tus datos. Inténtalo de nuevo.');
    } finally {
      setExporting(false);
    }
  }, [user, exporting]);

  const handleToggleNotif = useCallback(
    async (
      key: 'notifTripReminders' | 'notifBudgetSummary' | 'notifWeeklyInspiration',
      value: boolean,
    ) => {
      if (value) {
        const ok = await ensureNotificationPermissions();
        if (!ok) {
          Alert.alert(
            'Permiso necesario',
            'Activa las notificaciones de TripMate en los ajustes del sistema.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
            ],
          );
          return;
        }
      }
      ui.setNotif(key, value);
      const s = useUIStore.getState();
      await resyncNotifications(trips, {
        tripReminders: s.notifTripReminders,
        budgetSummary: s.notifBudgetSummary,
        weeklyInspiration: s.notifWeeklyInspiration,
      });
    },
    [trips, ui],
  );

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Eliminar cuenta',
      'Se borrarán permanentemente tus viajes, itinerarios, gastos, fotos y perfil. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              '¿Estás totalmente seguro?',
              'Última oportunidad para conservar tus datos.',
              [
                { text: 'No, conservar mi cuenta', style: 'cancel' },
                { text: 'Sí, eliminar todo', style: 'destructive', onPress: performDelete },
              ],
            ),
        },
      ],
    );
  }, [performDelete]);

  const pickLanguage = useCallback(() => {
    if (!user) return;
    Alert.alert('Idioma', 'Elige el idioma de la app', [
      ...LANGUAGES.map((l) => ({
        text: l.label,
        onPress: async () => {
          await updateProfile(user.id, { preferredLanguage: l.code });
          ui.setLanguage(l.code); // caché local
          // TODO(i18n): i18n.changeLanguage(l.code) cuando montemos la infra
        },
      })),
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  }, [user, updateProfile, ui]);

  const pickCurrency = useCallback(() => {
    if (!user) return;
    const popular = CURRENCIES.slice(0, 6);
    Alert.alert('Moneda por defecto', 'Se usará al crear viajes nuevos', [
      ...popular.map((c) => ({
        text: `${c.code} (${c.symbol})`,
        onPress: () => updateProfile(user.id, { defaultCurrency: c.code }),
      })),
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  }, [user, updateProfile]);

  const confirmSignOut = useCallback(() => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          clearProfile();
          await signOut();
        },
      },
    ]);
  }, [signOut, clearProfile]);

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Ajustes</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsSection label="Preferencias">
          <SettingsRow
            title="Idioma"
            value={languageLabel}
            variant="chevron"
            onPress={pickLanguage}
          />
          <SettingsRow
            title="Moneda"
            value={currencyLabel}
            variant="chevron"
            onPress={pickCurrency}
          />
        </SettingsSection>

        <SettingsSection label="Notificaciones">
          <SettingsRow
            title="Recordatorios de viaje"
            subtitle="24h antes del inicio"
            right={
              <Toggle
                value={ui.notifTripReminders}
                onValueChange={(v) => handleToggleNotif('notifTripReminders', v)}
              />
            }
          />
          <SettingsRow
            title="Resumen de presupuesto"
            subtitle="Cada lunes"
            right={
              <Toggle
                value={ui.notifBudgetSummary}
                onValueChange={(v) => handleToggleNotif('notifBudgetSummary', v)}
              />
            }
          />
          <SettingsRow
            title="Inspiración semanal"
            right={
              <Toggle
                value={ui.notifWeeklyInspiration}
                onValueChange={(v) => handleToggleNotif('notifWeeklyInspiration', v)}
              />
            }
          />
        </SettingsSection>

        <SettingsSection label="Datos y privacidad">
          <SettingsRow
            title="Exportar todos mis datos"
            variant="external"
            subtitle={exporting ? 'Preparando…' : undefined}
            onPress={() => handleExport}
          />
          <SettingsRow
            title="Eliminar cuenta"
            variant="danger"
            onPress={() => Alert.alert('Eliminar cuenta', 'Lo conectamos en el siguiente bloque')}
          />
        </SettingsSection>

        <Pressable style={styles.signOutButton} onPress={confirmSignOut}>
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>TripMate v{version}</Text>
          <Text style={styles.footerText}>hecho con ♥ para viajeros</Text>
        </View>
      </ScrollView>
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
