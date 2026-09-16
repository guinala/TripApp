import { setPlaceOwner } from "@/services/place-session";
import { useItineraryRefreshStore } from "@/store/itineraryRefreshStore";
import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/services/supabase";
import * as WebBrowser from "expo-web-browser";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { getAuthCallbackUrl } from "@/constants/auth";

let unsubscribeAuth: (() => void) | undefined;
let previousOwner: string | null = null;

function syncPlaceOwner(id: string | null) {
  setPlaceOwner(id);
  if (previousOwner !== id) useItineraryRefreshStore.getState().reset();
  previousOwner = id;
}

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: {
    email: string;
    password: string;
    displayName: string;
    currency: string;
    language: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
};

GoogleSignin.configure({
  webClientId:
    "1047320188759-3qgfgf8e2br33a35mfkfakotc6faf1nd.apps.googleusercontent.com",
  // iosClientId: 'TU_IOS_CLIENT_ID.apps.googleusercontent.com', // Android no hace falta
});

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,

  initialize: async () => {
    // 1. Lee la sesión que Supabase ya guardó en AsyncStorage
    const { data } = await supabase.auth.getSession();
    syncPlaceOwner(data.session?.user.id ?? null);
    set({
      session: data.session,
      user: data.session?.user ?? null,
      loading: false,
    });

    // 2. Se suscribe a cualquier cambio futuro de sesión
    unsubscribeAuth?.();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        syncPlaceOwner(session?.user.id ?? null);
        set({ session, user: session?.user ?? null });
      },
    );
    unsubscribeAuth = () => listener.subscription.unsubscribe();
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },

  signInWithGoogle: async () => {
    try {
      // 1. Intentar inicio de sesión nativo con Google Play Services (Android Only)
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (response.data?.idToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.data.idToken,
        });
        if (error) throw error;
        return;
      }
    } catch (nativeError: any) {
      console.warn(
        "[GoogleSignin] Fallback a navegador OAuth:",
        nativeError?.message ?? nativeError,
      );
    }

    // 2. Fallback mediante navegador WebBrowser usando el esquema 'tripmate'
    const redirectTo = getAuthCallbackUrl();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type !== "success") {
      return;
    }

    const { params, errorCode } = QueryParams.getQueryParams(result.url);

    if (errorCode) {
      throw new Error(errorCode);
    }

    if (params.access_token && params.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });

      if (sessionError) {
        throw sessionError;
      }

      return;
    }

    if (params.code) {
      const { error: exchangeError } = await supabase.auth
        .exchangeCodeForSession(params.code);

      if (exchangeError) {
        throw exchangeError;
      }

      return;
    }

    throw new Error("Google no ha devuelto una sesión válida.");
  },

  signUp: async (params: {
    email: string;
    password: string;
    displayName: string;
    currency: string;
    language: string;
  }) => {
    const emailRedirectTo = getAuthCallbackUrl();
    const { error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        emailRedirectTo,
        data: {
          display_name: params.displayName,
          default_currency: params.currency,
          preferred_language: params.language,
        },
      },
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  resetPassword: async (email: string) => {
    const redirectTo = getAuthCallbackUrl();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    if (error) throw error;
  },
}));
