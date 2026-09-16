import { usePlaceLanguage } from "@/hooks/use-place-details";
import { useEffect, useMemo, useState } from "react";
import { CurrentWeather, getCurrentWeather } from "@/services/weather";
import i18n from "@/i18n";

type WeatherState = {
  weather: CurrentWeather | null;
  loading: boolean;
  error: string | null;
};

type WeatherResult = {
  key: string;
  weather: CurrentWeather | null;
  error: string | null;
};

const IDLE: WeatherState = { weather: null, loading: false, error: null };

export function useWeather(
  lat: number | null,
  lng: number | null,
): WeatherState {
  const language = usePlaceLanguage();
  const [result, setResult] = useState<WeatherResult | null>(null);

  const key = lat != null && lng != null ? `${lat},${lng}|${language}` : null;

  useEffect(() => {
    if (key == null || lat == null || lng == null) return;

    let cancelled = false;
    getCurrentWeather(lat, lng, language)
      .then((weather) => {
        if (!cancelled) setResult({ key, weather, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setResult({
            key,
            weather: null,
            error: e instanceof Error
              ? e.message
              : i18n.t("errors.loadWeather"),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, lat, lng, language]);

  return useMemo(() => {
    if (key == null) return IDLE;
    if (result == null || result.key !== key) {
      return { weather: null, loading: true, error: null };
    }
    return { weather: result.weather, loading: false, error: result.error };
  }, [key, result]);
}
