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
  type ForecastLocale,
  type WeatherHourlyEntry,
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
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    pressure_msl?: number[];
    wind_speed_10m?: number[];
    wind_direction_10m?: number[];
    cloud_cover?: number[];
    precipitation?: number[];
    precipitation_probability?: number[];
  };
};

export type WeatherDayDetailed = {
  weather: WeatherSnapshot;
  hourlyWeather: WeatherHourlyEntry[];
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
  const detailed = mapOpenMeteoToWeatherDetailed(payload);
  if (!detailed) {
    return null;
  }

  return detailed.map((item) => item.weather);
}

export function mapOpenMeteoToWeatherDetailed(payload: OpenMeteoDailyResponse): WeatherDayDetailed[] | null {
  const daily = payload.daily;
  const hourly = payload.hourly;
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

  const series: WeatherDayDetailed[] = [];
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

    const dayWeather = normalizeWeatherSnapshot({
      airTemperatureC,
      pressureHpa,
      windSpeedMps,
      cloudCoverPct,
      precipitationMm,
    });

    const hourlyWeather = collectHourlyForDay(dayOffset, hourly, dayWeather);
    if (!hourlyWeather) {
      return null;
    }

    series.push({ weather: dayWeather, hourlyWeather });
  }

  return series;
}

function collectHourlyForDay(
  dayOffset: number,
  hourly: OpenMeteoDailyResponse['hourly'],
  fallback: WeatherSnapshot,
): WeatherHourlyEntry[] | null {
  if (!hourly?.time || hourly.time.length === 0) {
    return buildFallbackHourly(dayOffset, fallback);
  }

  const result: WeatherHourlyEntry[] = [];
  const from = dayOffset * 24;
  const to = from + 24;

  for (let index = from; index < to; index += 1) {
    const ts = hourly.time[index];
    const airTemperatureRaw = hourly.temperature_2m?.[index];
    const pressureRaw = hourly.pressure_msl?.[index];
    const windSpeedRaw = hourly.wind_speed_10m?.[index];
    const cloudCoverRaw = hourly.cloud_cover?.[index];
    const precipitationRaw = hourly.precipitation?.[index];
    const windDirectionRaw = hourly.wind_direction_10m?.[index];
    const popRaw = hourly.precipitation_probability?.[index];

    if (
      !ts ||
      !Number.isFinite(airTemperatureRaw) ||
      !Number.isFinite(pressureRaw) ||
      !Number.isFinite(windSpeedRaw) ||
      !Number.isFinite(cloudCoverRaw) ||
      !Number.isFinite(precipitationRaw)
    ) {
      return null;
    }

    const snapshot = normalizeWeatherSnapshot({
      airTemperatureC: Number(airTemperatureRaw),
      pressureHpa: Number(pressureRaw),
      windSpeedMps: Number(windSpeedRaw),
      cloudCoverPct: Number(cloudCoverRaw),
      precipitationMm: Number(precipitationRaw),
    });

    result.push({
      timestamp: new Date(ts).toISOString(),
      ...snapshot,
      windDirectionDeg: Number.isFinite(windDirectionRaw) ? Number(windDirectionRaw) : undefined,
      precipitationProbabilityPct: Number.isFinite(popRaw) ? Number(popRaw) : undefined,
    });
  }

  return result;
}

function buildFallbackHourly(dayOffset: number, weather: WeatherSnapshot): WeatherHourlyEntry[] {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() + dayOffset);

  const result: WeatherHourlyEntry[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    const ts = new Date(start);
    ts.setUTCHours(start.getUTCHours() + hour);
    result.push({
      timestamp: ts.toISOString(),
      ...weather,
    });
  }
  return result;
}

export async function fetchSevenDayWeather(
  point: { lat: number; lng: number },
  options?: { endpoint?: string; provider?: 'open-meteo' | 'proxy' },
): Promise<WeatherSnapshot[] | null> {
  const detailed = await fetchSevenDayWeatherDetailed(point, options);
  return detailed ? detailed.map((item) => item.weather) : null;
}

export async function fetchSevenDayWeatherDetailed(
  point: { lat: number; lng: number },
  options?: { endpoint?: string; provider?: 'open-meteo' | 'proxy' },
): Promise<WeatherDayDetailed[] | null> {
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
          hourly: [
            'temperature_2m',
            'pressure_msl',
            'wind_speed_10m',
            'wind_direction_10m',
            'cloud_cover',
            'precipitation',
            'precipitation_probability',
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
  return mapOpenMeteoToWeatherDetailed(json);
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

export async function fetchBiteForecastExpanded(
  apiBaseUrl: string,
  payload: Omit<BiteForecastRequest, 'debug'>,
  options?: { locale?: ForecastLocale },
) {
  return fetchBiteForecast(apiBaseUrl, {
    ...payload,
    locale: options?.locale ?? payload.locale,
    debug: true,
  });
}
