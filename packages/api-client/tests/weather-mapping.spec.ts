import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchSevenDayWeather, fetchSevenDayWeatherDetailed, mapOpenMeteoToWeatherDetailed, mapOpenMeteoToWeatherSeries } from '../src/index';

afterEach(() => {
  vi.restoreAllMocks();
});

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
      hourly: {
        time: Array.from({ length: 24 * 7 }, (_, i) => `2026-04-${String(Math.floor(i / 24) + 1).padStart(2, '0')}T${String(i % 24).padStart(2, '0')}:00`),
        temperature_2m: Array.from({ length: 24 * 7 }, () => 12),
        pressure_msl: Array.from({ length: 24 * 7 }, () => 1012),
        wind_speed_10m: Array.from({ length: 24 * 7 }, () => 3),
        wind_direction_10m: Array.from({ length: 24 * 7 }, () => 180),
        cloud_cover: Array.from({ length: 24 * 7 }, () => 45),
        precipitation: Array.from({ length: 24 * 7 }, () => 0),
        precipitation_probability: Array.from({ length: 24 * 7 }, () => 20),
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

  it('maps detailed weather series including hourly points', () => {
    const result = mapOpenMeteoToWeatherDetailed({
      daily: {
        time: Array.from({ length: 7 }, (_, i) => `2026-04-0${i + 1}`),
        temperature_2m_mean: [9, 10, 11, 12, 13, 14, 15],
        pressure_msl_mean: [1009, 1010, 1011, 1012, 1013, 1014, 1015],
        wind_speed_10m_mean: [2, 3, 2, 4, 5, 3, 2],
        cloud_cover_mean: [15, 25, 35, 45, 55, 65, 75],
        precipitation_sum: [0, 0.2, 1.1, 0, 0, 2.4, 0.3],
      },
      hourly: {
        time: Array.from({ length: 24 * 7 }, (_, i) => `2026-04-${String(Math.floor(i / 24) + 1).padStart(2, '0')}T${String(i % 24).padStart(2, '0')}:00`),
        temperature_2m: Array.from({ length: 24 * 7 }, () => 12),
        pressure_msl: Array.from({ length: 24 * 7 }, () => 1012),
        wind_speed_10m: Array.from({ length: 24 * 7 }, () => 3),
        wind_direction_10m: Array.from({ length: 24 * 7 }, () => 180),
        cloud_cover: Array.from({ length: 24 * 7 }, () => 45),
        precipitation: Array.from({ length: 24 * 7 }, () => 0),
        precipitation_probability: Array.from({ length: 24 * 7 }, () => 20),
      },
    });

    expect(result).not.toBeNull();
    expect(result?.[0]?.hourlyWeather).toHaveLength(24);
  });

  it('returns null for provider non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    const result = await fetchSevenDayWeather(
      { lat: 55.751244, lng: 37.618423 },
      { endpoint: '/api/weather/forecast', provider: 'proxy' },
    );

    expect(result).toBeNull();
  });

  it('returns null for malformed open-meteo payload', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ daily: { time: ['2026-04-01'] } }),
    } as Response);

    const result = await fetchSevenDayWeather({ lat: 55.751244, lng: 37.618423 }, { provider: 'open-meteo' });

    expect(result).toBeNull();
  });

  it('uses provider-specific query params for proxy endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ daily: {} }),
    } as Response);

    await fetchSevenDayWeather(
      { lat: 55.751244, lng: 37.618423 },
      { endpoint: '/api/weather/forecast', provider: 'proxy' },
    );

    const firstCallUrl = String(fetchMock.mock.calls[0]?.[0] ?? '');
    expect(firstCallUrl).toContain('lat=55.751244');
    expect(firstCallUrl).toContain('lng=37.618423');
    expect(firstCallUrl).not.toContain('latitude=');
    expect(firstCallUrl).not.toContain('daily=');
  });

  it('requests hourly params for open-meteo provider', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ daily: { time: Array(7).fill('2026-04-01'), temperature_2m_mean: Array(7).fill(10), pressure_msl_mean: Array(7).fill(1010), wind_speed_10m_mean: Array(7).fill(2), cloud_cover_mean: Array(7).fill(20), precipitation_sum: Array(7).fill(0) } }),
    } as Response);

    await fetchSevenDayWeatherDetailed({ lat: 55.751244, lng: 37.618423 }, { provider: 'open-meteo' });

    const firstCallUrl = String(fetchMock.mock.calls[0]?.[0] ?? '');
    expect(firstCallUrl).toContain('hourly=');
  });
});
