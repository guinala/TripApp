import { useEffect, useState } from 'react';
import { CurrentWeather, getCurrentWeather } from '@/services/weather';

type WeatherState = {
  weather: CurrentWeather | null;
  loading: boolean;
  error: string | null;
};

export function useWeather(lat: number | null, lng: number | null): WeatherState {
  const [state, setState] = useState<WeatherState>({
    weather: null,
    loading: lat != null && lng != null,
    error: null,
  });

  useEffect(() => {
    if (lat == null || lng == null) {
      setState({ weather: null, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState({ weather: null, loading: true, error: null });

    getCurrentWeather(lat, lng)
      .then((weather) => {
        if (!cancelled) setState({ weather, loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setState({
            weather: null,
            loading: false,
            error: e instanceof Error ? e.message : 'No se pudo cargar el clima',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return state;
}
