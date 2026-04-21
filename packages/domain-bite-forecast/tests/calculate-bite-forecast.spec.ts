import { describe, expect, it } from 'vitest';

import { calculateBiteForecast } from '../src/index';

describe('calculateBiteForecast', () => {
  it('returns good or excellent score for balanced conditions', () => {
    const result = calculateBiteForecast({
      point: { lat: 55.751244, lng: 37.618423 },
      timestamp: '2026-04-19T06:00:00.000Z',
      timezone: 'Europe/Moscow',
      waterbodyType: 'lake',
      weather: {
        pressureHpa: 1016,
        airTemperatureC: 18,
        windSpeedMps: 2,
        cloudCoverPct: 45,
        precipitationMm: 0,
        moonIlluminationPct: 50,
      },
    });

    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(['good', 'excellent']).toContain(result.level);
    expect(result.factors).toHaveLength(7);
  });

  it('returns poor or moderate score for hostile conditions', () => {
    const result = calculateBiteForecast({
      point: { lat: 55.751244, lng: 37.618423 },
      timestamp: '2026-04-19T06:00:00.000Z',
      timezone: 'Europe/Moscow',
      waterbodyType: 'river',
      weather: {
        pressureHpa: 1040,
        airTemperatureC: -12,
        windSpeedMps: 12,
        cloudCoverPct: 0,
        precipitationMm: 6,
        moonIlluminationPct: 99,
      },
    });

    expect(result.score).toBeLessThanOrEqual(45);
    expect(['poor', 'moderate']).toContain(result.level);
  });
});
