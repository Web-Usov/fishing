import { describe, expect, it, vi } from 'vitest';

import * as domainForecast from '@fishing/domain-bite-forecast';
import type { BiteForecastResult } from '@fishing/domain-bite-forecast';

import { ForecastService } from '../src/modules/forecast/forecast.service';

describe('ForecastService', () => {
  it('delegates calculation to domain use-case', () => {
    const input = {
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
    };

    const expected: BiteForecastResult = {
      score: 72,
      level: 'good',
      confidence: 'medium',
      factors: [{ id: 'pressure', label: 'Стабильное давление', impact: 12 }],
      strongestFactorId: 'pressure',
    };

    const spy = vi.spyOn(domainForecast, 'calculateBiteForecast').mockReturnValue(expected);
    const service = new ForecastService();

    const result = service.calculate(input);

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(input);
    expect(result).toEqual(expected);
  });
});
