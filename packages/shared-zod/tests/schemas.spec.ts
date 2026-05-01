import { describe, expect, it } from 'vitest';

import {
  biteForecastRequestSchema,
  biteForecastResponseSchema,
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
});
