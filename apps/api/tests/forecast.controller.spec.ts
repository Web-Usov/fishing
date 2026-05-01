import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { ForecastController } from '../src/modules/forecast/forecast.controller';
import { ForecastService } from '../src/modules/forecast/forecast.service';

function makeValidBody() {
  return {
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
}

describe('ForecastController', () => {
  it('throws BadRequestException for invalid request body', () => {
    const service = { calculate: vi.fn() } as unknown as ForecastService;
    const controller = new ForecastController(service);

    expect(() => controller.calculate({})).toThrow(BadRequestException);
    expect(service.calculate).not.toHaveBeenCalled();
  });

  it('calls service for valid body and returns contract-compliant response', () => {
    const service = {
      calculate: vi.fn().mockReturnValue({
        score: 72,
        level: 'good',
        confidence: 'medium',
        factors: [{ id: 'pressure', label: 'Стабильное давление', impact: 12 }],
        strongestFactorId: 'pressure',
      }),
    } as unknown as ForecastService;

    const controller = new ForecastController(service);
    const body = makeValidBody();
    const result = controller.calculate(body);

    expect(service.calculate).toHaveBeenCalledWith(body);
    expect(result).toMatchObject({
      score: 72,
      level: 'good',
      confidence: 'medium',
      factors: [{ id: 'pressure', label: 'Стабильное давление', impact: 12 }],
      explanation: expect.any(String),
    });
  });

  it('throws when service returns invalid response contract', () => {
    const service = {
      calculate: vi.fn().mockReturnValue({
        score: 172,
        level: 'good',
        confidence: 'medium',
        factors: [{ id: 'pressure', label: 'Стабильное давление', impact: 12 }],
        strongestFactorId: 'pressure',
      }),
    } as unknown as ForecastService;

    const controller = new ForecastController(service);

    expect(() => controller.calculate(makeValidBody())).toThrow();
  });
});
