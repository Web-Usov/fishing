import { describe, expect, it } from 'vitest';

import { calculateBiteForecast } from '../src/index';

function makeBaseRequest() {
  return {
    point: { lat: 55.751244, lng: 37.618423 },
    timestamp: '2026-10-19T05:00:00.000Z',
    timezone: 'Europe/Moscow',
    weather: {
      pressureHpa: 1016,
      airTemperatureC: 14,
      windSpeedMps: 2,
      cloudCoverPct: 40,
      precipitationMm: 0,
    },
  };
}

describe('calculateBiteForecast', () => {
  it('returns day score with expanded hourly model output', () => {
    const result = calculateBiteForecast(makeBaseRequest());

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(['poor', 'moderate', 'good', 'excellent']).toContain(result.level);
    expect(['low', 'medium', 'high']).toContain(result.confidence);
    expect(result.factors.length).toBeGreaterThanOrEqual(8);
    expect(result.strongestFactorId.length).toBeGreaterThan(0);
    expect(result.explanationLocalized.ru.length).toBeGreaterThan(0);
    expect(result.explanationLocalized.en.length).toBeGreaterThan(0);

    expect(result.expanded).toBeDefined();
    expect(result.expanded?.hourly).toHaveLength(24);
    expect(result.expanded?.bestWindows).toBeDefined();
    expect(result.expanded?.bestWindowThreshold).toBe(72);
  });

  it('exposes debug breakdown when debug flag is enabled', () => {
    const result = calculateBiteForecast({
      ...makeBaseRequest(),
      debug: true,
    });

    expect(result.expanded?.debugBreakdown).toBeDefined();
    expect(result.expanded?.debugBreakdown).toHaveLength(24);
  });

  it('supports locale selection in caller while keeping localized explanations ready', () => {
    const result = calculateBiteForecast({
      ...makeBaseRequest(),
      locale: 'en',
    });

    expect(result.explanationLocalized.en).toContain('bite');
  });

  it('uses provided hourly weather series when available', () => {
    const base = new Date('2026-10-19T00:00:00.000Z');
    const hourlyWeather = Array.from({ length: 24 }, (_, idx) => {
      const ts = new Date(base);
      ts.setUTCHours(base.getUTCHours() + idx);
      return {
        timestamp: ts.toISOString(),
        pressureHpa: 1015,
        airTemperatureC: idx < 12 ? 10 : 18,
        windSpeedMps: idx < 12 ? 1.5 : 4,
        cloudCoverPct: 35,
        precipitationMm: 0,
      };
    });

    const result = calculateBiteForecast({
      ...makeBaseRequest(),
      hourlyWeather,
    });

    expect(result.expanded?.hourly[0]?.timestamp).toBe(hourlyWeather[0]?.timestamp);
    expect(result.expanded?.hourly[23]?.timestamp).toBe(hourlyWeather[23]?.timestamp);
  });
});
