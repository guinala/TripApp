import { Stack } from 'expo-router';

export default function TripLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="expenses/new" />
      <Stack.Screen name="photo/[photoId]" options={{ presentation: 'fullScreenModal' }} />
    </Stack>
  );
}
