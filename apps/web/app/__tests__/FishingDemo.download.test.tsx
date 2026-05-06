import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { FishingDemo } from '../components/FishingDemo';

const { fetchBiteForecastMock, fetchSevenDayWeatherDetailedMock } = vi.hoisted(() => ({
  fetchBiteForecastMock: vi.fn(),
  fetchSevenDayWeatherDetailedMock: vi.fn(),
}));

let selectedLocationFromUrl: { lat: number; lng: number } | null = { lat: 59.9391, lng: 30.3159 };

vi.mock('@fishing/api-client', () => ({
  fetchBiteForecast: fetchBiteForecastMock,
  fetchSevenDayWeatherDetailed: fetchSevenDayWeatherDetailedMock,
}));

vi.mock('../components/map/ProviderMap', () => ({
  ProviderMap: () => <div data-testid="provider-map" />,
}));

vi.mock('../components/runtime', () => ({
  parseLocationFromUrl: vi.fn(() => selectedLocationFromUrl),
  resolveApiBaseUrl: vi.fn(() => 'http://api.test'),
}));

const localeDictionary: Record<string, string> = {
  report_title: 'Bite forecast report',
  report_generated_at_label: 'Generated at',
  report_generated_for_label: 'Forecast for',
  report_point_label: 'Point',
  report_latitude_label: 'Latitude',
  report_longitude_label: 'Longitude',
  report_waterbody_type_label: 'Waterbody type',
  report_7d_section_label: '7-day forecast',
  report_day_label: 'Day',
  report_date_label: 'Date',
  report_score_label: 'Score',
  report_level_label: 'Level',
  report_confidence_label: 'Confidence',
  report_temperature_label: 'Temperature',
  report_pressure_label: 'Pressure',
  report_wind_label: 'Wind',
  report_explanation_label: 'Explanation',
  report_factors_label: 'Factors',
  report_disclaimer_title: 'Disclaimer',
  report_disclaimer: 'This report is informational and does not guarantee fishing results.',
  report_filename_prefix: 'bite forecast/report',
  report_disabled_reason: 'Report is unavailable: pick a point and wait for a 7-day forecast.',
  forecast_data_unavailable_error: 'Not enough reliable weather data to calculate forecast. Please try again later.',
  report_build_unknown_error: 'Unknown error.',
  report_build_failed_error: 'Failed to build Markdown report.',
  low: 'low',
  medium: 'medium',
  high: 'high',
  level_poor: 'poor',
  level_moderate: 'moderate',
  level_good: 'good',
  level_excellent: 'excellent',
  live_map: 'Live map',
  map_click_title: 'Click map',
  map_click_hint: 'Hint',
  provider: 'Provider',
  yandex_maps: 'Yandex Maps',
  google_adapter: 'Google Maps',
  selected_point: 'Selected',
  choose_point: 'Choose point',
  forecast: 'Forecast',
  forecast_7d: '7-day forecast',
  state_empty_title: 'Pick point',
  state_empty_body: 'Pick point first',
  state_loading_title: 'Loading',
  state_loading_body: 'Loading body',
  state_error_title: 'Error',
  retry: 'Retry',
  coordinates: 'Coordinates',
  weather_source: 'Weather source',
  real_weather: 'Real weather',
  updating_forecast: 'Updating',
  day_details: 'Day details',
  confidence: 'Confidence',
  temperature: 'Temperature',
  pressure: 'Pressure',
  wind: 'Wind',
  click_for_factor_details: 'Click for factor details',
  factor_impact: 'Factor impact',
};

const stableT = (key: string) => localeDictionary[key] ?? key;

vi.mock('../components/locale/LocaleProvider', () => ({
  useLocale: () => {
    return {
      locale: 'en',
      t: stableT,
    };
  },
}));

function makeWeatherSeries(length = 7) {
  return Array.from({ length }, (_, idx) => ({
    weather: {
      pressureHpa: 1000 + idx,
      airTemperatureC: 12 + idx,
      windSpeedMps: 3 + idx,
      cloudCoverPct: 40,
      precipitationMm: 0,
    },
    hourlyWeather: Array.from({ length: 24 }, (_, hour) => ({
      timestamp: `2026-04-${String(idx + 1).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00.000Z`,
      pressureHpa: 1000 + idx,
      airTemperatureC: 12 + idx,
      windSpeedMps: 3 + idx,
      cloudCoverPct: 40,
      precipitationMm: 0,
    })),
  }));
}

function makeForecast(level: 'poor' | 'moderate' | 'good' | 'excellent' = 'good') {
  return {
    score: 75,
    level,
    confidence: 'high' as const,
    factors: [{ id: 'pressure', label: 'Pressure', impact: 8 }],
    explanation: 'Stable period.',
  };
}

describe('FishingDemo markdown download', () => {
  beforeAll(() => {
    (globalThis as { React?: typeof React }).React = React;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    selectedLocationFromUrl = { lat: 59.9391, lng: 30.3159 };
  });

  it('downloads markdown and revokes object URL after click', async () => {
    fetchSevenDayWeatherDetailedMock.mockResolvedValue(makeWeatherSeries(7));
    fetchBiteForecastMock.mockResolvedValue(makeForecast());

    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:demo-url'),
      configurable: true,
      writable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      configurable: true,
      writable: true,
    });

    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:demo-url');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<FishingDemo />);

    const button = await screen.findByTestId('forecast-download-md-btn');
    await waitFor(() => expect(button).toBeEnabled());

    fireEvent.click(button);

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    const blobArg = createObjectURLSpy.mock.calls[0]?.[0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    const downloadAnchor = clickSpy.mock.instances[0] as HTMLAnchorElement | undefined;
    const expectedDatePart = new Date().toISOString().slice(0, 10);
    expect(downloadAnchor?.download).toBe(`bite-forecast-report-59.93910-30.31590-${expectedDatePart}-en.md`);
    expect(downloadAnchor?.download).toContain('bite-forecast-report');
    expect(downloadAnchor?.download).not.toContain('/');
    expect(downloadAnchor?.download).not.toContain(' ');
    expect(downloadAnchor?.download).not.toMatch(/[\\/:*?"<>|\s]/);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:demo-url');
  });

  it('keeps download disabled when there is no selected point', async () => {
    selectedLocationFromUrl = null;

    render(<FishingDemo />);

    const button = await screen.findByTestId('forecast-download-md-btn');
    await waitFor(() => expect(button).toBeDisabled());
    expect(screen.getByTestId('forecast-download-md-disabled-reason')).toHaveTextContent(
      'Report is unavailable: pick a point and wait for a 7-day forecast.',
    );
  });

  it('keeps download disabled when forecast data is incomplete', async () => {
    fetchSevenDayWeatherDetailedMock.mockResolvedValue(makeWeatherSeries(6));
    fetchBiteForecastMock.mockResolvedValue(makeForecast('moderate'));

    render(<FishingDemo />);

    const button = await screen.findByTestId('forecast-download-md-btn');
    await waitFor(() => expect(button).toBeDisabled());
    expect(screen.getByTestId('forecast-download-md-disabled-reason')).toHaveTextContent(
      'Report is unavailable: pick a point and wait for a 7-day forecast.',
    );
  });
});
