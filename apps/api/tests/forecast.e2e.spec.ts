import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';

describe('ForecastController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns bite forecast payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/forecast/calculate')
      .send({
        point: { lat: 55.751244, lng: 37.618423 },
        timestamp: '2026-04-19T06:00:00.000Z',
        timezone: 'Europe/Moscow',
        waterbodyType: 'lake',
        weather: {
          pressureHpa: 1018,
          airTemperatureC: 16,
          windSpeedMps: 2,
          cloudCoverPct: 35,
          precipitationMm: 0,
          moonIlluminationPct: 48,
        },
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      level: expect.any(String),
      score: expect.any(Number),
      explanation: expect.any(String),
    });
  });
});
