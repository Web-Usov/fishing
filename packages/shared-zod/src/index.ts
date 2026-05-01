import { z } from 'zod';

export const LATITUDE_MIN = -90;
export const LATITUDE_MAX = 90;
export const LONGITUDE_MIN = -180;
export const LONGITUDE_MAX = 180;

export const WEATHER_PRESSURE_MIN = 930;
export const WEATHER_PRESSURE_MAX = 1085;
export const WEATHER_TEMPERATURE_MIN = -50;
export const WEATHER_TEMPERATURE_MAX = 50;
export const WEATHER_WIND_SPEED_MIN = 0;
export const WEATHER_WIND_SPEED_MAX = 60;
export const WEATHER_CLOUD_COVER_MIN = 0;
export const WEATHER_CLOUD_COVER_MAX = 100;
export const WEATHER_PRECIPITATION_MIN = 0;
export const WEATHER_PRECIPITATION_MAX = 500;

export const geoPointSchema = z.object({
  lat: z.number().min(LATITUDE_MIN).max(LATITUDE_MAX),
  lng: z.number().min(LONGITUDE_MIN).max(LONGITUDE_MAX),
});

export const weatherSnapshotSchema = z.object({
  pressureHpa: z.number().min(WEATHER_PRESSURE_MIN).max(WEATHER_PRESSURE_MAX),
  airTemperatureC: z.number().min(WEATHER_TEMPERATURE_MIN).max(WEATHER_TEMPERATURE_MAX),
  windSpeedMps: z.number().min(WEATHER_WIND_SPEED_MIN).max(WEATHER_WIND_SPEED_MAX),
  cloudCoverPct: z.number().min(WEATHER_CLOUD_COVER_MIN).max(WEATHER_CLOUD_COVER_MAX),
  precipitationMm: z.number().min(WEATHER_PRECIPITATION_MIN).max(WEATHER_PRECIPITATION_MAX),
});

export const biteForecastRequestSchema = z.object({
  point: geoPointSchema,
  timestamp: z.iso.datetime(),
  timezone: z.string().min(1),
  weather: weatherSnapshotSchema,
});

export const biteForecastLevelSchema = z.enum(['poor', 'moderate', 'good', 'excellent']);
export const forecastConfidenceSchema = z.enum(['low', 'medium', 'high']);

export const biteForecastFactorSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  impact: z.number().min(-30).max(30),
});

export const biteForecastResponseSchema = z.object({
  score: z.number().min(0).max(100),
  level: biteForecastLevelSchema,
  confidence: forecastConfidenceSchema,
  factors: z.array(biteForecastFactorSchema).min(1),
  explanation: z.string().min(1),
});

export type BiteForecastRequest = z.infer<typeof biteForecastRequestSchema>;
export type BiteForecastResponse = z.infer<typeof biteForecastResponseSchema>;
export type BiteForecastFactor = z.infer<typeof biteForecastFactorSchema>;
export type WeatherSnapshot = z.infer<typeof weatherSnapshotSchema>;
export type GeoPoint = z.infer<typeof geoPointSchema>;
export type BiteForecastLevel = z.infer<typeof biteForecastLevelSchema>;
export type ForecastConfidence = z.infer<typeof forecastConfidenceSchema>;
