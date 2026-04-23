"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type AppLocale = 'ru' | 'en';
type LocaleMode = 'auto' | AppLocale;

type Dictionary = Record<string, { ru: string; en: string }>;

type LocaleContextValue = {
  locale: AppLocale;
  mode: LocaleMode;
  setMode: (mode: LocaleMode) => void;
  t: (key: LocaleKey) => string;
};

const STORAGE_KEY = 'fishing-locale-mode';

const dictionary = {
  app_title: { ru: 'Fishing demo', en: 'Fishing demo' },
  app_subtitle: { ru: 'Карта + прогноз на 7 дней по выбранной координате.', en: 'Map + 7-day forecast for selected coordinate.' },
  locale_ru: { ru: 'Русский', en: 'Russian' },
  locale_en: { ru: 'English', en: 'English' },
  locale_auto: { ru: 'Авто', en: 'Auto' },
  live_map: { ru: 'Live map', en: 'Live map' },
  map_click_title: {
    ru: 'Кликните по любой точке карты — получите прогноз на 7 дней.',
    en: 'Click any point on the map to get a 7-day forecast.',
  },
  map_click_hint: {
    ru: 'Без заранее подготовленных точек. Координата из клика сохраняется в URL для шаринга.',
    en: 'No predefined points. Clicked coordinates are stored in URL for sharing.',
  },
  my_location: { ru: 'Моё местоположение', en: 'My location' },
  locating: { ru: 'Определяем…', en: 'Locating…' },
  choose_point: { ru: 'Выберите точку кликом', en: 'Click to select point' },
  selected_point: { ru: 'Выбрано', en: 'Selected' },
  provider: { ru: 'Provider', en: 'Provider' },
  yandex_maps: { ru: 'Яндекс.Карты', en: 'Yandex Maps' },
  google_adapter: { ru: 'Google Maps (адаптер)', en: 'Google Maps (adapter)' },
  forecast: { ru: 'Forecast', en: 'Forecast' },
  forecast_7d: { ru: 'Прогноз на 7 дней', en: '7-day forecast' },
  pick_point_first: { ru: 'Сначала выберите точку кликом на карте.', en: 'Pick a point on the map first.' },
  updating_forecast: { ru: 'Обновляем прогноз…', en: 'Updating forecast…' },
  coordinates: { ru: 'Координаты', en: 'Coordinates' },
  day_details: { ru: 'Детали дня', en: 'Day details' },
  confidence: { ru: 'Уверенность', en: 'Confidence' },
  waterbody_type: { ru: 'Тип водоёма', en: 'Waterbody type' },
  temperature: { ru: 'Температура', en: 'Temperature' },
  pressure: { ru: 'Давление', en: 'Pressure' },
  wind: { ru: 'Ветер', en: 'Wind' },
  geolocation_secure_required: {
    ru: 'Геолокация доступна только по HTTPS или на localhost.',
    en: 'Geolocation is available only on HTTPS or localhost.',
  },
  geolocation_failed: { ru: 'Не удалось определить геолокацию.', en: 'Unable to determine geolocation.' },
  map_loading: { ru: 'Загружаем карту', en: 'Loading map' },
  map_init: { ru: 'Инициализируем выбранный map provider…', en: 'Initializing selected map provider…' },
  map_error: { ru: 'Ошибка карты', en: 'Map error' },
  missing_yandex_key: {
    ru: 'Нет NEXT_PUBLIC_YANDEX_MAPS_API_KEY — используем режим без ключа.',
    en: 'NEXT_PUBLIC_YANDEX_MAPS_API_KEY is missing — using no-key mode.',
  },
  low: { ru: 'низкая', en: 'low' },
  medium: { ru: 'средняя', en: 'medium' },
  high: { ru: 'высокая', en: 'high' },
  level_poor: { ru: 'слабый', en: 'poor' },
  level_moderate: { ru: 'средний', en: 'moderate' },
  level_good: { ru: 'хороший', en: 'good' },
  level_excellent: { ru: 'отличный', en: 'excellent' },
  weather_profile: { ru: 'Профиль погоды', en: 'Weather profile' },
  factor_impact: { ru: 'Вклад фактора', en: 'Factor impact' },
  click_for_factor_details: { ru: 'Нажмите на фактор для деталей.', en: 'Click factor for details.' },
  geocode_waterbody_failed: {
    ru: 'Не удалось определить тип водоёма по карте, используем профиль lake.',
    en: 'Could not resolve waterbody type from map, using lake profile.',
  },
  loading_forecast: { ru: 'Считаем прогноз на 7 дней…', en: 'Calculating 7-day forecast…' },
  api_endpoint: { ru: 'API', en: 'API' },
  base_url: { ru: 'Base URL', en: 'Base URL' },
  real_weather: { ru: 'Реальная погода', en: 'Real weather' },
  fallback_weather: { ru: 'Оценочная погода (fallback)', en: 'Estimated weather (fallback)' },
  fallback_weather_warning: {
    ru: 'Внешний погодный источник недоступен — используются оценочные значения, точность прогноза ниже.',
    en: 'External weather source is unavailable — estimated values are used, forecast accuracy is lower.',
  },
  weather_source: { ru: 'Источник погоды', en: 'Weather source' },
  state_empty_title: { ru: 'Выберите точку на карте', en: 'Pick a point on the map' },
  state_empty_body: {
    ru: 'Кликните по карте, и мы построим прогноз на 7 дней по выбранной координате.',
    en: 'Click on the map and we will build a 7-day forecast for selected coordinates.',
  },
  state_loading_title: { ru: 'Собираем погодные данные', en: 'Collecting weather data' },
  state_loading_body: {
    ru: 'Получаем 7-дневный прогноз и рассчитываем итоговую оценку клёва…',
    en: 'Fetching 7-day forecast and calculating bite score…',
  },
  state_error_title: { ru: 'Не удалось обновить прогноз', en: 'Failed to refresh forecast' },
  retry: { ru: 'Повторить', en: 'Retry' },
} satisfies Dictionary;

export type LocaleKey = keyof typeof dictionary;

const LocaleContext = createContext<LocaleContextValue | null>(null);

function resolveBrowserLocale(): AppLocale {
  if (typeof window === 'undefined') {
    return 'ru';
  }

  const language = window.navigator.language.toLowerCase();
  return language.startsWith('ru') ? 'ru' : 'en';
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<LocaleMode>('auto');
  const [autoLocale, setAutoLocale] = useState<AppLocale>('ru');

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'ru' || saved === 'en' || saved === 'auto') {
      setModeState(saved);
    }

    setAutoLocale(resolveBrowserLocale());
  }, []);

  const locale = mode === 'auto' ? autoLocale : mode;

  const setMode = useCallback((nextMode: LocaleMode) => {
    setModeState(nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);

    if (nextMode === 'auto') {
      setAutoLocale(resolveBrowserLocale());
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      mode,
      setMode,
      t: (key) => dictionary[key][locale],
    }),
    [locale, mode, setMode],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider.');
  }

  return context;
}
