"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchBiteForecast, fetchSevenDayWeather } from '@fishing/api-client';
import type {
  BiteForecastRequest,
  BiteForecastResponse,
  ForecastConfidence,
  WeatherSnapshot,
} from '@fishing/shared-zod';

import { useLocale } from './locale/LocaleProvider';
import { ProviderMap } from './map/ProviderMap';
import type { MapPoint, MapProvider } from './map/types';
import { parseLocationFromUrl, resolveApiBaseUrl, type SelectedLocation } from './runtime';

type DayForecast = {
  dayOffset: number;
  label: string;
  timestamp: string;
  weather: WeatherSnapshot;
  response: BiteForecastResponse;
};

type ForecastState = {
  loading: boolean;
  error: string | null;
  days: DayForecast[];
  weatherSource: 'real' | null;
};

const MAP_PROVIDER: MapProvider = process.env.NEXT_PUBLIC_MAP_PROVIDER === 'google' ? 'google' : 'yandex';
const YANDEX_MAPS_API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
const DEFAULT_CENTER: [number, number] = [59.939095, 30.315868];

const levelColor: Record<BiteForecastResponse['level'], string> = {
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
  timeOfDay: {
    ru: 'Суточный ритм меняет активность рыбы: пики чаще приходятся на утро и вечер.',
    en: 'Daily rhythm affects fish activity: peaks are usually in morning and evening.',
  },
  season: {
    ru: 'Сезон задаёт базовую динамику активности и влияет на силу отклика на погоду.',
    en: 'Season sets baseline activity dynamics and influences weather response strength.',
  },
};


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

function buildPayload(
  location: SelectedLocation,
  timestamp: Date,
  weather: WeatherSnapshot,
): BiteForecastRequest {
  return {
    point: { lat: location.lat, lng: location.lng },
    timestamp: timestamp.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
        const now = new Date();
        const realWeather = await fetchSevenDayWeather(location, {
          endpoint: '/api/weather/forecast',
          provider: 'proxy',
        });
        if (!realWeather) {
          throw new Error('Weather data unavailable');
        }

        const weatherSource: ForecastState['weatherSource'] = 'real';

        const requests = Array.from({ length: 7 }, async (_, dayOffset) => {
          const date = new Date(now);
          date.setDate(now.getDate() + dayOffset);

          const weather = realWeather[dayOffset];
          if (!weather) {
            throw new Error('Incomplete weather series');
          }
          const payload = buildPayload(location, date, weather);
          const response = await fetchBiteForecast(apiBaseUrl, payload);

          return {
            dayOffset,
            label: formatDayLabel(date, locale),
            timestamp: date.toISOString(),
            weather: payload.weather,
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
            error: locale === 'ru' ? 'Недостаточно достоверных погодных данных для расчёта прогноза. Попробуйте позже.' : 'Not enough reliable weather data to calculate forecast. Please try again later.',
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

  const levelLabels: Record<BiteForecastResponse['level'], string> = {
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
            {t('weather_source')}: <strong>{t('real_weather')}</strong>
          </div>
        ) : null}

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
