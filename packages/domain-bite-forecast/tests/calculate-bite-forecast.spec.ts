import { describe, expect, it } from 'vitest';

import { calculateBiteForecast } from '../src/index';

function makeBaseRequest() {
  return {
    point: { lat: 55.751244, lng: 37.618423 },
    timestamp: '2026-10-19T05:00:00.000Z',
    timezone: 'Europe/Moscow',
    weather: {
      pressureHpa: 1000,
      airTemperatureC: 8,
      windSpeedMps: 6,
      cloudCoverPct: 10,
      precipitationMm: 0,
    },
  };
}

function getFactorImpact(result: ReturnType<typeof calculateBiteForecast>, factorId: string) {
  const factor = result.factors.find((item) => item.id === factorId);
  expect(factor).toBeDefined();
  if (!factor) {
    throw new Error(`Missing factor ${factorId}`);
  }
  return factor.impact;
}

function getFactorLabel(result: ReturnType<typeof calculateBiteForecast>, factorId: string) {
  const factor = result.factors.find((item) => item.id === factorId);
  expect(factor).toBeDefined();
  if (!factor) {
    throw new Error(`Missing factor ${factorId}`);
  }
  return factor.label;
}

describe('calculateBiteForecast', () => {
  it('keeps response ranges and includes new factors', () => {
    const result = calculateBiteForecast(makeBaseRequest());

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(['poor', 'moderate', 'good', 'excellent']).toContain(result.level);
    expect(['low', 'medium', 'high']).toContain(result.confidence);
    expect(result.factors).toHaveLength(7);
    expect(result.factors.every((factor) => factor.impact >= -30 && factor.impact <= 30)).toBe(true);
    expect(result.factors.some((factor) => factor.id === 'timeOfDay')).toBe(true);
    expect(result.factors.some((factor) => factor.id === 'season')).toBe(true);
  });

  it('returns good score for early autumn morning and highlights time/season context', () => {
    const result = calculateBiteForecast({
      ...makeBaseRequest(),
      timestamp: '2026-10-19T04:30:00.000Z',
      timezone: 'Europe/Moscow',
      weather: {
        pressureHpa: 1000,
        airTemperatureC: 8,
        windSpeedMps: 6,
        cloudCoverPct: 30,
        precipitationMm: 0,
      },
    });

    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(['good', 'excellent']).toContain(result.level);
    expect(getFactorImpact(result, 'timeOfDay')).toBe(9);
    expect(getFactorImpact(result, 'season')).toBe(4);
    expect(result.explanation).toMatch(/клёв: ключевой фактор — .+\./i);
  });

  it('returns near-mid score at summer midday and confidence is not high', () => {
    const result = calculateBiteForecast({
      ...makeBaseRequest(),
      timestamp: '2026-07-19T12:30:00.000Z',
      timezone: 'Europe/Moscow',
      weather: {
        pressureHpa: 1016,
        airTemperatureC: 18,
        windSpeedMps: 8,
        cloudCoverPct: 0,
        precipitationMm: 0,
      },
    });

    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThanOrEqual(62);
    expect(result.confidence).not.toBe('high');
  });

  it('returns poor score for winter deep night with unfavorable conditions', () => {
    const result = calculateBiteForecast({
      ...makeBaseRequest(),
      timestamp: '2026-01-19T00:30:00.000Z',
      timezone: 'Europe/Moscow',
      weather: {
        pressureHpa: 1008,
        airTemperatureC: 10,
        windSpeedMps: 8,
        cloudCoverPct: 0,
        precipitationMm: 2.5,
      },
    });

    expect(result.score).toBeLessThanOrEqual(39);
    expect(result.level).toBe('poor');

    const offset = Math.abs(result.score - 50);
    const expectedConfidence = offset >= 25 ? 'high' : offset >= 15 ? 'medium' : 'low';
    expect(result.confidence).toBe(expectedConfidence);
  });

  it('uses offset-based confidence (regression around near-mid score)', () => {
    const result = calculateBiteForecast({
      ...makeBaseRequest(),
      timestamp: '2026-07-19T12:00:00.000Z',
      timezone: 'Europe/Moscow',
      weather: {
        pressureHpa: 1016,
        airTemperatureC: 18,
        windSpeedMps: 8,
        cloudCoverPct: 0,
        precipitationMm: 0,
      },
    });

    expect(result.score).toBe(62);
    expect(result.confidence).toBe('low');
  });

  it('handles time-of-day boundaries in local timezone', () => {
    const earlyMorning = calculateBiteForecast({
      ...makeBaseRequest(),
      timestamp: '2026-10-19T01:00:00.000Z',
      timezone: 'Europe/Moscow',
    });
    const dayStart = calculateBiteForecast({
      ...makeBaseRequest(),
      timestamp: '2026-10-19T08:00:00.000Z',
      timezone: 'Europe/Moscow',
    });
    const lateEvening = calculateBiteForecast({
      ...makeBaseRequest(),
      timestamp: '2026-10-19T19:00:00.000Z',
      timezone: 'Europe/Moscow',
    });
    const deepNight = calculateBiteForecast({
      ...makeBaseRequest(),
      timestamp: '2026-10-19T20:00:00.000Z',
      timezone: 'Europe/Moscow',
    });

    expect(getFactorImpact(earlyMorning, 'timeOfDay')).toBe(9);
    expect(getFactorImpact(dayStart, 'timeOfDay')).toBe(-4);
    expect(getFactorImpact(lateEvening, 'timeOfDay')).toBe(6);
    expect(getFactorImpact(deepNight, 'timeOfDay')).toBe(-9);
  });

  it('handles season boundaries by timestamp month', () => {
    const march = calculateBiteForecast({
      ...makeBaseRequest(),
      timestamp: '2026-03-01T12:00:00.000Z',
    });
    const june = calculateBiteForecast({
      ...makeBaseRequest(),
      timestamp: '2026-06-01T12:00:00.000Z',
    });
    const september = calculateBiteForecast({
      ...makeBaseRequest(),
      timestamp: '2026-09-01T12:00:00.000Z',
    });
    const december = calculateBiteForecast({
      ...makeBaseRequest(),
      timestamp: '2026-12-01T12:00:00.000Z',
    });

    expect(getFactorImpact(march, 'season')).toBe(4);
    expect(getFactorImpact(june, 'season')).toBe(1);
    expect(getFactorImpact(september, 'season')).toBe(4);
    expect(getFactorImpact(december, 'season')).toBe(-3);
    expect(getFactorLabel(december, 'season')).toContain('Зим');
  });
});
