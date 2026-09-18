import '@/i18n';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Stack, useSegments } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/store/authStore';
import { useFonts } from 'expo-font';
import { colors } from '@/constants/theme';
import { initNotifications } from '@/services/notifications';

SplashScreen.preventAutoHideAsync();
initNotifications();

export default function RootLayout() {
  const [attempt, setAttempt] = useState(0);
  return <Layout key={attempt} onRetry={() => setAttempt((n) => n + 1)} />;
}

function Layout({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  const segments = useSegments();
  const light = segments.some((segment) => segment === 'welcome' || segment === 'photo');
  const [authError, setAuthError] = useState(false);
  const initialize = useAuthStore((s) => s.initialize);

  const [fontsLoaded, fontsError] = useFonts({
    'PlusJakartaSans-Regular': require('../../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Medium': require('../../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('../../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('../../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'PlusJakartaSans-ExtraBold': require('../../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'InstrumentSerif-Regular': require('../../assets/fonts/InstrumentSerif-Regular.ttf'),
    'InstrumentSerif-Italic': require('../../assets/fonts/InstrumentSerif-Italic.ttf'),
    'JetBrainsMono-Regular': require('../../assets/fonts/JetBrainsMono-Regular.ttf'),
  });

  useEffect(() => {
    void initialize().catch(() => setAuthError(true));
  }, [initialize]);

  useEffect(() => {
    if (fontsLoaded || fontsError || authError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontsError, authError]);

  if (fontsError || authError)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: 24,
          gap: 16,
          backgroundColor: colors.surfacePaper,
        }}
      >
        <Text style={{ color: colors.secondary }}>{t('fixes.startupError')}</Text>
        <Pressable accessibilityRole="button" onPress={onRetry} style={{ padding: 16 }}>
          <Text>{t('places.retry')}</Text>
        </Pressable>
      </View>
    );

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfaceCream,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="auth/callback" />
          <Stack.Screen name="reset-password" />
        </Stack>
        <StatusBar style={light ? 'light' : 'dark'} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
