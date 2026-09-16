import type { PlaceLanguage } from "@/types/place";
import { createTtlCache } from "@/utils/ttlCache";

// Openweather
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_KEY;
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 min

export type CurrentWeather = {
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  windKmh: number;
};

const cache = createTtlCache<CurrentWeather>(CACHE_TTL_MS);

function cacheKey(lat: number, lng: number, language: PlaceLanguage): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}|${language}`;
}

export async function getCurrentWeather(
  lat: number,
  lng: number,
  language: PlaceLanguage = "es",
): Promise<CurrentWeather> {
  const key = cacheKey(lat, lng, language);
  const cached = cache.get(key);
  if (cached) return cached;

  if (!API_KEY) {
    throw new Error("Falta EXPO_PUBLIC_OPENWEATHER_KEY en el entorno");
  }

  const url =
    `${BASE_URL}?lat=${lat}&lon=${lng}&units=metric&lang=${language}&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OpenWeather respondió ${res.status}`);
  }

  const json = (await res.json()) as {
    main: { temp: number; humidity: number };
    weather: { description: string; icon: string }[];
    wind: { speed: number }; // m/s
  };

  const raw = json.weather[0];
  const weather: CurrentWeather = {
    temp: Math.round(json.main.temp),
    description: raw
      ? raw.description.charAt(0).toUpperCase() + raw.description.slice(1)
      : "—",
    icon: raw?.icon ?? "01d",
    humidity: json.main.humidity,
    windKmh: Math.round(json.wind.speed * 3.6),
  };

  cache.set(key, weather);
  return weather;
}

export function weatherIconName(code: string): string {
  const night = code.endsWith("n");
  const base = code.slice(0, 2);
  switch (base) {
    case "01": // despejado
      return night ? "moon" : "sunny";
    case "02":
      return night ? "cloudy-night" : "partly-sunny";
    case "03":
    case "04":
      return "cloudy";
    case "09":
      return "rainy";
    case "10":
      return "rainy";
    case "11":
      return "thunderstorm";
    case "13":
      return "snow";
    case "50":
      return "reorder-three";
    default:
      return "partly-sunny";
  }
}
