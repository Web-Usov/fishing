import { biteForecastResponseSchema, type BiteForecastRequest } from '@fishing/shared-zod';

export type WeatherSnapshot = {
  pressureHpa: number;
  airTemperatureC: number;
  windSpeedMps: number;
  cloudCoverPct: number;
  precipitationMm: number;
  moonIlluminationPct: number;
};

type OpenMeteoDailyResponse = {
  daily?: {
    time?: string[];
    temperature_2m_mean?: number[];
    pressure_msl_mean?: number[];
    wind_speed_10m_mean?: number[];
    cloud_cover_mean?: number[];
    precipitation_sum?: number[];
  };
};

function normalizeWeatherSnapshot(input: Partial<WeatherSnapshot>): WeatherSnapshot {
  return {
    pressureHpa: Math.min(1085, Math.max(930, Math.round(input.pressureHpa ?? 1013))),
    airTemperatureC: Math.min(50, Math.max(-50, Math.round(input.airTemperatureC ?? 12))),
    windSpeedMps: Math.min(60, Math.max(0, Math.round(input.windSpeedMps ?? 3))),
    cloudCoverPct: Math.min(100, Math.max(0, Math.round(input.cloudCoverPct ?? 40))),
    precipitationMm: Math.min(500, Math.max(0, Number((input.precipitationMm ?? 0).toFixed(1)))),
    moonIlluminationPct: Math.min(100, Math.max(0, Math.round(input.moonIlluminationPct ?? 50))),
  };
}

export function mapOpenMeteoToWeatherSeries(payload: OpenMeteoDailyResponse): WeatherSnapshot[] | null {
  const daily = payload.daily;
  if (!daily) {
    return null;
  }

  const length = Math.min(
    daily.time?.length ?? 0,
    daily.temperature_2m_mean?.length ?? 0,
    daily.pressure_msl_mean?.length ?? 0,
    daily.wind_speed_10m_mean?.length ?? 0,
    daily.cloud_cover_mean?.length ?? 0,
    daily.precipitation_sum?.length ?? 0,
  );

  if (length < 7) {
    return null;
  }

  return Array.from({ length: 7 }, (_, dayOffset) =>
    normalizeWeatherSnapshot({
      airTemperatureC: daily.temperature_2m_mean?.[dayOffset] ?? 12,
      pressureHpa: daily.pressure_msl_mean?.[dayOffset] ?? 1013,
      windSpeedMps: daily.wind_speed_10m_mean?.[dayOffset] ?? 3,
      cloudCoverPct: daily.cloud_cover_mean?.[dayOffset] ?? 40,
      precipitationMm: daily.precipitation_sum?.[dayOffset] ?? 0,
      moonIlluminationPct: 50,
    }),
  );
}

export async function fetchSevenDayWeather(point: { lat: number; lng: number }): Promise<WeatherSnapshot[] | null> {
  const params = new URLSearchParams({
    latitude: point.lat.toString(),
    longitude: point.lng.toString(),
    timezone: 'auto',
    forecast_days: '7',
    wind_speed_unit: 'ms',
    daily: [
      'temperature_2m_mean',
      'pressure_msl_mean',
      'wind_speed_10m_mean',
      'cloud_cover_mean',
      'precipitation_sum',
    ].join(','),
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as OpenMeteoDailyResponse;
  return mapOpenMeteoToWeatherSeries(json);
}

export async function fetchBiteForecast(apiBaseUrl: string, payload: BiteForecastRequest) {
  const response = await fetch(`${apiBaseUrl}/forecast/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();
  return biteForecastResponseSchema.parse(json);
}
