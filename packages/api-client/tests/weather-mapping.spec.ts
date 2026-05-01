import { describe, expect, it } from 'vitest';

import { mapOpenMeteoToWeatherSeries } from '../src/index';

describe('mapOpenMeteoToWeatherSeries', () => {
  it('maps first 7 days into WeatherSnapshot series', () => {
    const result = mapOpenMeteoToWeatherSeries({
      daily: {
        time: Array.from({ length: 7 }, (_, i) => `2026-04-0${i + 1}`),
        temperature_2m_mean: [9, 10, 11, 12, 13, 14, 15],
        pressure_msl_mean: [1009, 1010, 1011, 1012, 1013, 1014, 1015],
        wind_speed_10m_mean: [2, 3, 2, 4, 5, 3, 2],
        cloud_cover_mean: [15, 25, 35, 45, 55, 65, 75],
        precipitation_sum: [0, 0.2, 1.1, 0, 0, 2.4, 0.3],
      },
    });

    expect(result).not.toBeNull();
    expect(result).toHaveLength(7);

    expect(result?.[0]).toMatchObject({
      airTemperatureC: 9,
      pressureHpa: 1009,
      windSpeedMps: 2,
      cloudCoverPct: 15,
      precipitationMm: 0,
    });
  });

  it('returns null when daily arrays are incomplete', () => {
    const result = mapOpenMeteoToWeatherSeries({
      daily: {
        time: ['2026-04-01'],
        temperature_2m_mean: [9],
        pressure_msl_mean: [1009],
        wind_speed_10m_mean: [2],
        cloud_cover_mean: [15],
        precipitation_sum: [0],
      },
    });

    expect(result).toBeNull();
  });
});
