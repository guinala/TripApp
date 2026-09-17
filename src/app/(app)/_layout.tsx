import { useEffect } from 'react';
import { setPlaceForeground } from '@/services/place-session';
import { useAuthStore } from '@/store/authStore';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, AppState, View } from 'react-native';

export default function AppLayout() {
  const { session, loading } = useAuthStore();
  useEffect(() => {
    setPlaceForeground(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (state) =>
      setPlaceForeground(state === 'active'),
    );
    return () => {
      subscription.remove();
      setPlaceForeground(false);
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/welcome" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="trips/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings" />
      <Stack.Screen name="profile/edit" />
    </Stack>
  );
}
