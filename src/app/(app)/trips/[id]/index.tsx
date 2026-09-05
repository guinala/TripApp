import { Redirect, useLocalSearchParams } from 'expo-router';

export default function TripIndex() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  if (!id) return <Redirect href="/" />;

  return (
    <Redirect
      href={{
        pathname: '/trips/[id]/itinerary',
        params: { id },
      }}
    />
  );
}
