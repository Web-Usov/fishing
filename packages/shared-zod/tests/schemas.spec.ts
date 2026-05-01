import { describe, expect, it } from 'vitest';

import {
  LATITUDE_MAX,
  LATITUDE_MIN,
  LONGITUDE_MAX,
  LONGITUDE_MIN,
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
  biteForecastRequestSchema,
  biteForecastResponseSchema,
  geoPointSchema,
  weatherSnapshotSchema,
} from '../src/index';

describe('shared-zod', () => {
  it('accepts valid forecast request payload', () => {
    const result = biteForecastRequestSchema.safeParse({
      point: { lat: 55.751244, lng: 37.618423 },
      timestamp: '2026-04-19T06:00:00.000Z',
      timezone: 'Europe/Moscow',
      weather: {
        pressureHpa: 1018,
        airTemperatureC: 16,
        windSpeedMps: 2,
        cloudCoverPct: 35,
        precipitationMm: 0,
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid forecast response payload', () => {
    const result = biteForecastResponseSchema.safeParse({
      score: 120,
      level: 'excellent',
      confidence: 'high',
      factors: [],
      explanation: '',
    });

    expect(result.success).toBe(false);
  });

  it('keeps geo bounds constants aligned with schema', () => {
    expect(geoPointSchema.safeParse({ lat: LATITUDE_MIN, lng: LONGITUDE_MIN }).success).toBe(true);
    expect(geoPointSchema.safeParse({ lat: LATITUDE_MAX, lng: LONGITUDE_MAX }).success).toBe(true);
    expect(geoPointSchema.safeParse({ lat: LATITUDE_MIN - 1, lng: 0 }).success).toBe(false);
    expect(geoPointSchema.safeParse({ lat: 0, lng: LONGITUDE_MAX + 1 }).success).toBe(false);
  });

  it('keeps weather bounds constants aligned with schema', () => {
    const valid = weatherSnapshotSchema.safeParse({
      pressureHpa: WEATHER_PRESSURE_MIN,
      airTemperatureC: WEATHER_TEMPERATURE_MAX,
      windSpeedMps: WEATHER_WIND_SPEED_MAX,
      cloudCoverPct: WEATHER_CLOUD_COVER_MIN,
      precipitationMm: WEATHER_PRECIPITATION_MAX,
    });
    const invalid = weatherSnapshotSchema.safeParse({
      pressureHpa: WEATHER_PRESSURE_MAX + 1,
      airTemperatureC: WEATHER_TEMPERATURE_MIN - 1,
      windSpeedMps: WEATHER_WIND_SPEED_MIN - 1,
      cloudCoverPct: WEATHER_CLOUD_COVER_MAX + 1,
      precipitationMm: WEATHER_PRECIPITATION_MIN - 0.1,
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });
});
