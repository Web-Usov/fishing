import {
  WEATHER_CLOUD_COVER_MAX,
  WEATHER_CLOUD_COVER_MIN,
  WEATHER_PRECIPITATION_MAX,
  WEATHER_PRECIPITATION_MIN,
  WEATHER_PRESSURE_MAX,
  WEATHER_PRESSURE_MIN,
  WEATHER_TEMPERATURE_MAX,
  WEATHER_TEMPERATURE_MIN,
  WEATHER_WIND_SPEED_MAX,
  WEATHER_WIND_SPEED_MIN,
  biteForecastResponseSchema,
  type BiteForecastRequest,
  type WeatherSnapshot,
} from '@fishing/shared-zod';

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

function normalizeWeatherSnapshot(input: WeatherSnapshot): WeatherSnapshot {
  return {
    pressureHpa: Math.min(WEATHER_PRESSURE_MAX, Math.max(WEATHER_PRESSURE_MIN, Math.round(input.pressureHpa))),
    airTemperatureC: Math.min(
      WEATHER_TEMPERATURE_MAX,
      Math.max(WEATHER_TEMPERATURE_MIN, Math.round(input.airTemperatureC)),
    ),
    windSpeedMps: Math.min(WEATHER_WIND_SPEED_MAX, Math.max(WEATHER_WIND_SPEED_MIN, Math.round(input.windSpeedMps))),
    cloudCoverPct: Math.min(WEATHER_CLOUD_COVER_MAX, Math.max(WEATHER_CLOUD_COVER_MIN, Math.round(input.cloudCoverPct))),
    precipitationMm: Math.min(
      WEATHER_PRECIPITATION_MAX,
      Math.max(WEATHER_PRECIPITATION_MIN, Number(input.precipitationMm.toFixed(1))),
    ),
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

  const series: WeatherSnapshot[] = [];
  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const airTemperatureRaw = daily.temperature_2m_mean?.[dayOffset];
    const pressureRaw = daily.pressure_msl_mean?.[dayOffset];
    const windSpeedRaw = daily.wind_speed_10m_mean?.[dayOffset];
    const cloudCoverRaw = daily.cloud_cover_mean?.[dayOffset];
    const precipitationRaw = daily.precipitation_sum?.[dayOffset];

    if (
      !Number.isFinite(airTemperatureRaw) ||
      !Number.isFinite(pressureRaw) ||
      !Number.isFinite(windSpeedRaw) ||
      !Number.isFinite(cloudCoverRaw) ||
      !Number.isFinite(precipitationRaw)
    ) {
      return null;
    }

    const airTemperatureC = Number(airTemperatureRaw);
    const pressureHpa = Number(pressureRaw);
    const windSpeedMps = Number(windSpeedRaw);
    const cloudCoverPct = Number(cloudCoverRaw);
    const precipitationMm = Number(precipitationRaw);

    series.push(
      normalizeWeatherSnapshot({
        airTemperatureC,
        pressureHpa,
        windSpeedMps,
        cloudCoverPct,
        precipitationMm,
      }),
    );
  }

  return series;
}

export async function fetchSevenDayWeather(
  point: { lat: number; lng: number },
  options?: { endpoint?: string; provider?: 'open-meteo' | 'proxy' },
): Promise<WeatherSnapshot[] | null> {
  const endpoint = options?.endpoint ?? 'https://api.open-meteo.com/v1/forecast';
  const provider = options?.provider ?? 'open-meteo';

  const params = new URLSearchParams(
    provider === 'open-meteo'
      ? {
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
        }
      : {
          lat: point.lat.toString(),
          lng: point.lng.toString(),
        },
  );

  const separator = endpoint.includes('?') ? '&' : '?';
  const response = await fetch(`${endpoint}${separator}${params.toString()}`, {
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
