import * as Linking from 'expo-linking';

export const getAuthCallbackUrl = () =>
  Linking.createURL('/auth/callback');