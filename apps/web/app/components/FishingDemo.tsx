"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchBiteForecast, fetchSevenDayWeather } from '@fishing/api-client';

import { useLocale } from './locale/LocaleProvider';
import { ProviderMap } from './map/ProviderMap';
import type { MapPoint, MapProvider } from './map/types';

type WaterbodyType = 'lake' | 'river' | 'reservoir' | 'pond';
type ForecastLevel = 'poor' | 'moderate' | 'good' | 'excellent';
type ForecastConfidence = 'low' | 'medium' | 'high';

type ForecastFactor = {
  id: string;
  label: string;
  impact: number;
};

type WeatherSnapshot = {
  pressureHpa: number;
  airTemperatureC: number;
  windSpeedMps: number;
  cloudCoverPct: number;
  precipitationMm: number;
  moonIlluminationPct: number;
};

type BiteForecastRequest = {
  point: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  timezone: string;
  waterbodyType: WaterbodyType;
  weather: WeatherSnapshot;
};

type BiteForecastResponse = {
  score: number;
  level: ForecastLevel;
  confidence: ForecastConfidence;
  factors: ForecastFactor[];
  explanation: string;
};

type SelectedLocation = {
  lat: number;
  lng: number;
};

type DayForecast = {
  dayOffset: number;
  label: string;
  timestamp: string;
  weather: WeatherSnapshot;
  waterbodyType: WaterbodyType;
  response: BiteForecastResponse;
};

type ForecastState = {
  loading: boolean;
  error: string | null;
  days: DayForecast[];
  weatherSource: 'real' | 'fallback' | null;
};

const MAP_PROVIDER: MapProvider = process.env.NEXT_PUBLIC_MAP_PROVIDER === 'google' ? 'google' : 'yandex';
const YANDEX_MAPS_API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
const DEFAULT_CENTER: [number, number] = [59.939095, 30.315868];

const levelColor: Record<ForecastLevel, string> = {
  poor: '#dc2626',
  moderate: '#d97706',
  good: '#059669',
  excellent: '#16a34a',
};

const factorDescription: Record<string, { ru: string; en: string }> = {
  pressure: {
    ru: 'Показывает стабильность атмосферы: резкие перепады часто снижают активность рыбы.',
    en: 'Reflects atmospheric stability: sharp pressure changes often reduce fish activity.',
  },
  wind: {
    ru: 'Ветер влияет на перемешивание воды и доступ кислорода, что меняет поведение рыбы.',
    en: 'Wind affects water mixing and oxygen levels, changing fish behavior.',
  },
  temperature: {
    ru: 'Температура воды/воздуха задаёт комфортный диапазон активности для большинства видов.',
    en: 'Water/air temperature defines activity comfort range for most species.',
  },
  clouds: {
    ru: 'Облачность меняет освещённость воды: иногда это делает рыбу активнее у поверхности.',
    en: 'Cloud cover changes water light conditions and can increase near-surface activity.',
  },
  precipitation: {
    ru: 'Осадки влияют на мутность и давление, что может как помогать, так и мешать клёву.',
    en: 'Precipitation affects turbidity and pressure, sometimes helping, sometimes harming bite.',
  },
  moon: {
    ru: 'Лунная освещённость может влиять на кормовую активность, особенно в тёмное время.',
    en: 'Moon illumination may impact feeding activity, especially at night.',
  },
  waterbody: {
    ru: 'Тип водоёма задаёт базовый профиль поведения рыбы для расчёта прогноза.',
    en: 'Waterbody type sets baseline fish behavior profile for forecast calculation.',
  },
};

function resolveApiBaseUrl() {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }

  return 'http://127.0.0.1:3001';
}

function parseLocationFromUrl(): SelectedLocation | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const url = new URL(window.location.href);
  const latRaw = url.searchParams.get('lat');
  const lngRaw = url.searchParams.get('lng');
  if (!latRaw || !lngRaw) {
    return null;
  }

  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return { lat, lng };
}

function updateLocationInUrl(location: SelectedLocation | null) {
  if (typeof window === 'undefined') {
    return;
  }

  const currentScrollY = window.scrollY;
  const url = new URL(window.location.href);
  if (!location) {
    url.searchParams.delete('lat');
    url.searchParams.delete('lng');
  } else {
    url.searchParams.set('lat', location.lat.toFixed(5));
    url.searchParams.set('lng', location.lng.toFixed(5));
  }

  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
  window.scrollTo({ top: currentScrollY, left: 0, behavior: 'auto' });
}

function estimateWeatherByCoordinates(lat: number, lng: number, dayOffset: number): WeatherSnapshot {
  const seed = Math.abs(Math.sin(lat * 0.17 + lng * 0.11 + dayOffset * 0.53));

  return {
    pressureHpa: Math.round(1004 + seed * 20),
    airTemperatureC: Math.round(6 + seed * 18),
    windSpeedMps: Math.round(1 + seed * 7),
    cloudCoverPct: Math.round(18 + seed * 76),
    precipitationMm: Number((seed * 2.8).toFixed(1)),
    moonIlluminationPct: Math.round(14 + seed * 82),
  };
}


async function resolveWaterbodyTypeFromReality(location: SelectedLocation): Promise<WaterbodyType | null> {
  if (typeof window === 'undefined' || !window.ymaps?.geocode) {
    return null;
  }

  try {
    const result = await window.ymaps.geocode([location.lat, location.lng], { kind: 'hydro', results: 1 });
    const first = result.geoObjects.get(0);
    const rawName = first?.properties.get('name') ?? first?.properties.get('text') ?? '';
    const name = rawName.toLowerCase();

    if (name.includes('река') || name.includes('river')) {
      return 'river';
    }
    if (name.includes('водохранилищ') || name.includes('reservoir')) {
      return 'reservoir';
    }
    if (name.includes('пруд') || name.includes('pond')) {
      return 'pond';
    }
    if (name.includes('озер') || name.includes('lake')) {
      return 'lake';
    }
  } catch {
    return null;
  }

  return null;
}

function buildPayload(
  location: SelectedLocation,
  timestamp: Date,
  weather: WeatherSnapshot,
  waterbodyType: WaterbodyType,
): BiteForecastRequest {
  return {
    point: { lat: location.lat, lng: location.lng },
    timestamp: timestamp.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    waterbodyType,
    weather,
  };
}

function formatDayLabel(date: Date, locale: 'ru' | 'en') {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

export function FishingDemo() {
  const { locale, t } = useLocale();
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [locationHydratedFromUrl, setLocationHydratedFromUrl] = useState(false);
  const [forecastState, setForecastState] = useState<ForecastState>({
    loading: false,
    error: null,
    days: [],
    weatherSource: null,
  });
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [expandedFactorId, setExpandedFactorId] = useState<string | null>(null);

  useEffect(() => {
    setApiBaseUrl(resolveApiBaseUrl());
    setSelectedLocation(parseLocationFromUrl());
    setLocationHydratedFromUrl(true);
  }, []);

  useEffect(() => {
    if (!locationHydratedFromUrl) {
      return;
    }

    updateLocationInUrl(selectedLocation);
  }, [locationHydratedFromUrl, selectedLocation]);

  const selectedPoint: MapPoint | null = useMemo(() => {
    if (!selectedLocation) {
      return null;
    }

    return {
      id: 'selected-point',
      name: `${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}`,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
    };
  }, [selectedLocation]);

  const onSelectCoordinates = useCallback((coordinates: [number, number]) => {
    setSelectedLocation({ lat: coordinates[0], lng: coordinates[1] });
  }, []);

  useEffect(() => {
    if (!selectedLocation || !apiBaseUrl) {
      return;
    }

    const location = selectedLocation;
    let disposed = false;

    async function loadSevenDayForecast() {
      setForecastState((current) => ({ ...current, loading: true, error: null }));

      try {
        const waterbodyType = (await resolveWaterbodyTypeFromReality(location)) ?? 'lake';
        const now = new Date();
        const realWeather = await fetchSevenDayWeather(location, { endpoint: '/api/weather/forecast' });
        const weatherSource: ForecastState['weatherSource'] = realWeather ? 'real' : 'fallback';

        const requests = Array.from({ length: 7 }, async (_, dayOffset) => {
          const date = new Date(now);
          date.setDate(now.getDate() + dayOffset);

          const weather = realWeather?.[dayOffset] ?? estimateWeatherByCoordinates(location.lat, location.lng, dayOffset);
          const payload = buildPayload(location, date, weather, waterbodyType);
          const response = await fetchBiteForecast(apiBaseUrl, payload);

          return {
            dayOffset,
            label: formatDayLabel(date, locale),
            timestamp: date.toISOString(),
            weather: payload.weather,
            waterbodyType: payload.waterbodyType,
            response,
          } satisfies DayForecast;
        });

        const days = await Promise.all(requests);
        if (!disposed) {
          setForecastState({ loading: false, error: null, days, weatherSource });
          setSelectedDayIndex((current) => (current < days.length ? current : 0));
          setExpandedFactorId(null);
        }
      } catch {
        if (!disposed) {
          setForecastState((current) => ({
            loading: false,
            error: locale === 'ru' ? 'Не удалось получить прогноз на 7 дней. Проверьте API и CORS.' : 'Failed to load 7-day forecast. Check API and CORS.',
            days: current.days,
            weatherSource: current.weatherSource,
          }));
        }
      }
    }

    void loadSevenDayForecast();

    return () => {
      disposed = true;
    };
  }, [apiBaseUrl, selectedLocation, locale]);

  const selectedDay = forecastState.days[selectedDayIndex] ?? null;

  const confidenceLabels: Record<ForecastConfidence, string> = {
    low: t('low'),
    medium: t('medium'),
    high: t('high'),
  };

  const levelLabels: Record<ForecastLevel, string> = {
    poor: t('level_poor'),
    moderate: t('level_moderate'),
    good: t('level_good'),
    excellent: t('level_excellent'),
  };

  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.15fr) minmax(360px, 460px)',
        gap: 16,
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          borderRadius: 12,
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          padding: 14,
          minHeight: 700,
          display: 'grid',
          gap: 10,
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ color: 'var(--accent)', fontSize: 11, letterSpacing: 0.7, textTransform: 'uppercase', fontWeight: 700 }}>
            {t('live_map')}
          </div>
          <h2 style={{ margin: 0, color: 'var(--text)', fontSize: 24, lineHeight: 1.25 }}>{t('map_click_title')}</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>{t('map_click_hint')}</p>
        </div>

        <ProviderMap
          provider={MAP_PROVIDER}
          yandexApiKey={YANDEX_MAPS_API_KEY}
          selectedPoint={selectedPoint}
          defaultCenter={DEFAULT_CENTER}
          onSelectCoordinates={onSelectCoordinates}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 10px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--panel-muted)',
            color: 'var(--text-muted)',
            fontSize: 12,
          }}
        >
          <span>
            {t('provider')}: <strong>{MAP_PROVIDER === 'yandex' ? t('yandex_maps') : t('google_adapter')}</strong>
          </span>
          <span>{selectedPoint ? `${t('selected_point')}: ${selectedPoint.name}` : t('choose_point')}</span>
        </div>
      </div>

      <aside
        style={{
          borderRadius: 12,
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          padding: 14,
          minHeight: 700,
          display: 'grid',
          gap: 12,
          alignContent: 'start',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div>
          <div style={{ color: 'var(--accent)', fontSize: 11, letterSpacing: 0.7, textTransform: 'uppercase', fontWeight: 700 }}>
            {t('forecast')}
          </div>
          <h3 style={{ margin: '6px 0 0', color: 'var(--text)', fontSize: 24 }}>{t('forecast_7d')}</h3>
        </div>

        {!selectedLocation ? (
          <StateCard title={t('state_empty_title')} body={t('state_empty_body')} />
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {t('coordinates')}: <strong>{selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}</strong>
          </div>
        )}

        {forecastState.weatherSource ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {t('weather_source')}: <strong>{forecastState.weatherSource === 'real' ? t('real_weather') : t('fallback_weather')}</strong>
          </div>
        ) : null}

        {forecastState.weatherSource === 'fallback' ? <InlineNotice text={t('fallback_weather_warning')} tone="error" /> : null}

        {forecastState.loading && forecastState.days.length === 0 ? <StateCard title={t('state_loading_title')} body={t('state_loading_body')} /> : null}
        {forecastState.loading && forecastState.days.length > 0 ? <InlineNotice text={t('updating_forecast')} /> : null}

        {forecastState.error && forecastState.days.length === 0 ? (
          <StateCard
            title={t('state_error_title')}
            body={forecastState.error}
            tone="error"
            action={
              <button
                type="button"
                onClick={() => {
                  setSelectedLocation((current) => (current ? { ...current } : current));
                }}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: 'var(--panel)',
                  color: 'var(--text)',
                  fontSize: 12,
                  padding: '6px 10px',
                  cursor: 'pointer',
                }}
              >
                {t('retry')}
              </button>
            }
          />
        ) : null}

        {forecastState.error && forecastState.days.length > 0 ? <InlineNotice text={forecastState.error} tone="error" /> : null}

        {forecastState.days.length > 0 ? (
          <div style={{ display: 'grid', gap: 8 }}>
            {forecastState.days.map((day, index) => {
              const active = index === selectedDayIndex;
              const color = levelColor[day.response.level];

              return (
                <button
                  key={day.timestamp}
                  type="button"
                  onClick={() => {
                    setSelectedDayIndex(index);
                    setExpandedFactorId(null);
                  }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    alignItems: 'center',
                    gap: 8,
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: active ? `1px solid ${color}` : '1px solid var(--border)',
                    background: active ? 'var(--panel-muted)' : 'var(--panel)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 13 }}>{day.label}</span>
                  <span style={{ color, fontWeight: 700 }}>{levelLabels[day.response.level]}</span>
                  <span style={{ fontWeight: 700 }}>{day.response.score}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {selectedDay ? (
          <div
            style={{
              marginTop: 2,
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--panel-muted)',
              padding: 12,
              display: 'grid',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--accent)', fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>
                {t('day_details')}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                {t('confidence')}: {confidenceLabels[selectedDay.response.confidence]}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
              <MiniDetail label={t('waterbody_type')} value={selectedDay.waterbodyType} />
              <MiniDetail label={t('temperature')} value={`${selectedDay.weather.airTemperatureC}°C`} />
              <MiniDetail label={t('pressure')} value={`${selectedDay.weather.pressureHpa} hPa`} />
              <MiniDetail label={t('wind')} value={`${selectedDay.weather.windSpeedMps} м/с`} />
            </div>

            <div style={{ color: 'var(--text)', lineHeight: 1.45 }}>{selectedDay.response.explanation}</div>

            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t('click_for_factor_details')}</div>
            <div style={{ display: 'grid', gap: 6 }}>
              {selectedDay.response.factors.map((factor) => {
                const expanded = expandedFactorId === factor.id;
                const description = factorDescription[factor.id]?.[locale] ?? '';

                return (
                  <button
                    key={factor.id}
                    type="button"
                    onClick={() => setExpandedFactorId((current) => (current === factor.id ? null : factor.id))}
                    style={{
                      display: 'grid',
                      gap: 6,
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--panel)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ color: 'var(--text)', fontSize: 13 }}>{factor.label}</span>
                      <strong style={{ color: factor.impact >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {factor.impact >= 0 ? `+${factor.impact}` : factor.impact}
                      </strong>
                    </div>
                    {expanded ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.45 }}>
                        {description || t('factor_impact')}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </aside>
    </section>
  );
}

function InlineNotice({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'error' }) {
  return (
    <div
      style={{
        borderRadius: 10,
        padding: '10px 12px',
        border: tone === 'error' ? '1px solid var(--danger)' : '1px solid var(--border)',
        background: tone === 'error' ? 'rgba(185,28,28,.12)' : 'var(--panel-muted)',
        color: tone === 'error' ? 'var(--danger)' : 'var(--text-muted)',
        fontSize: 13,
      }}
    >
      {text}
    </div>
  );
}

function MiniDetail({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--panel)',
        padding: '8px 10px',
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
    </div>
  );
}

function StateCard({
  title,
  body,
  tone = 'neutral',
  action,
}: {
  title: string;
  body: string;
  tone?: 'neutral' | 'error';
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: tone === 'error' ? '1px solid var(--danger)' : '1px solid var(--border)',
        background: tone === 'error' ? 'rgba(185,28,28,.12)' : 'var(--panel-muted)',
        padding: 12,
        display: 'grid',
        gap: 6,
      }}
    >
      <strong style={{ color: tone === 'error' ? 'var(--danger)' : 'var(--text)', fontSize: 13 }}>{title}</strong>
      <div style={{ color: tone === 'error' ? 'var(--danger)' : 'var(--text-muted)', fontSize: 13 }}>{body}</div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
