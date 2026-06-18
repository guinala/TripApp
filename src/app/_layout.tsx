import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/authStore';
import { useFonts } from 'expo-font';

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': require('../../assets/fonts/InstrumentSerif-Regular.ttf'),
    'PlusJakartaSans-Medium': require('../../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('../../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('../../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'PlusJakartaSans-ExtraBold': require('../../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'InstrumentSerif-Regular': require('../../assets/fonts/InstrumentSerif-Regular.ttf'),
    'InstrumentSerif-Italic': require('../../assets/fonts/InstrumentSerif-Italic.ttf'),
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!fontsLoaded) {
    return null; // pendiente: poner <ActivityIndicator>
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
