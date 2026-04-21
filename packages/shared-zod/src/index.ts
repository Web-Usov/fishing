import { geoPointSchema } from '@fishing/domain-geo';
import { z } from 'zod';

export const waterbodyTypeSchema = z.enum(['lake', 'river', 'reservoir', 'pond']);

export const weatherSnapshotSchema = z.object({
  pressureHpa: z.number().min(930).max(1085),
  airTemperatureC: z.number().min(-50).max(50),
  windSpeedMps: z.number().min(0).max(60),
  cloudCoverPct: z.number().min(0).max(100),
  precipitationMm: z.number().min(0).max(500),
  moonIlluminationPct: z.number().min(0).max(100),
});

export const biteForecastRequestSchema = z.object({
  point: geoPointSchema,
  timestamp: z.iso.datetime(),
  timezone: z.string().min(1),
  waterbodyType: waterbodyTypeSchema,
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
