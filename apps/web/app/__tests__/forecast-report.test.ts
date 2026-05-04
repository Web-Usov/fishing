import type { BiteForecastResponse, WeatherSnapshot } from '@fishing/shared-zod';

import { buildForecastMarkdownReport } from '../components/forecast-report';

function buildResponse(score: number, level: BiteForecastResponse['level']): BiteForecastResponse {
  return {
    score,
    level,
    confidence: 'high',
    factors: [{ id: 'pressure', label: 'Pressure', impact: 6 }],
    explanation: 'Stable weather window.',
  };
}

function buildWeather(dayOffset: number): WeatherSnapshot {
  return {
    pressureHpa: 1015 + dayOffset,
    airTemperatureC: 14 + dayOffset,
    windSpeedMps: 4 + dayOffset,
    cloudCoverPct: 30,
    precipitationMm: 1,
  };
}

function buildDays() {
  return Array.from({ length: 7 }, (_, dayOffset) => {
    const date = new Date('2026-05-01T08:00:00.000Z');
    date.setUTCDate(date.getUTCDate() + dayOffset);

    return {
      dayOffset,
      timestamp: date.toISOString(),
      response: buildResponse(70 + dayOffset, dayOffset % 2 === 0 ? 'good' : 'moderate'),
      weather: buildWeather(dayOffset),
    };
  });
}

const ruLabels = {
  title: 'Отчёт по прогнозу клёва',
  generatedAtLabel: 'Сформировано',
  generatedForLabel: 'Прогноз для',
  pointLabel: 'Точка',
  latitudeLabel: 'Широта',
  longitudeLabel: 'Долгота',
  waterbodyTypeLabel: 'Тип водоёма',
  section7dLabel: 'Прогноз на 7 дней',
  dayLabel: 'День',
  dateLabel: 'Дата',
  scoreLabel: 'Балл',
  levelLabel: 'Уровень',
  confidenceLabel: 'Уверенность',
  temperatureLabel: 'Температура',
  pressureLabel: 'Давление',
  windLabel: 'Ветер',
  explanationLabel: 'Пояснение',
  factorsLabel: 'Факторы',
  disclaimerTitle: 'Дисклеймер',
  disclaimer: 'Отчёт носит информационный характер и не гарантирует результат рыбалки.',
  confidenceLabels: { low: 'низкая', medium: 'средняя', high: 'высокая' },
  levelLabels: { poor: 'слабый', moderate: 'средний', good: 'хороший', excellent: 'отличный' },
} as const;

const enLabels = {
  title: 'Bite forecast report',
  generatedAtLabel: 'Generated at',
  generatedForLabel: 'Forecast for',
  pointLabel: 'Point',
  latitudeLabel: 'Latitude',
  longitudeLabel: 'Longitude',
  waterbodyTypeLabel: 'Waterbody type',
  section7dLabel: '7-day forecast',
  dayLabel: 'Day',
  dateLabel: 'Date',
  scoreLabel: 'Score',
  levelLabel: 'Level',
  confidenceLabel: 'Confidence',
  temperatureLabel: 'Temperature',
  pressureLabel: 'Pressure',
  windLabel: 'Wind',
  explanationLabel: 'Explanation',
  factorsLabel: 'Factors',
  disclaimerTitle: 'Disclaimer',
  disclaimer: 'This report is informational and does not guarantee fishing results.',
  confidenceLabels: { low: 'low', medium: 'medium', high: 'high' },
  levelLabels: { poor: 'poor', moderate: 'moderate', good: 'good', excellent: 'excellent' },
} as const;

describe('buildForecastMarkdownReport', () => {
  it('builds RU markdown with required title, 7-day section, and disclaimer', () => {
    const markdown = buildForecastMarkdownReport({
      selectedLocation: { lat: 59.9391, lng: 30.3159 },
      pointName: 'Нева',
      waterbodyType: 'river',
      forecastDays: buildDays(),
      locale: 'ru',
      generatedAtIso: '2026-05-01T10:15:00.000Z',
      labels: ruLabels,
    });

    expect(markdown).toContain('# Отчёт по прогнозу клёва');
    expect(markdown).toContain('## Прогноз на 7 дней');
    expect(markdown).toContain('## Дисклеймер');
    expect(markdown).toContain('- Пояснение: Stable weather window.');
    expect(markdown).toContain('- Факторы:');
    expect(markdown).toContain(ruLabels.disclaimer);
    expect(markdown).toContain('- День 1');
    expect(markdown).toContain('- Точка: Нева');
  });

  it('builds EN markdown with required title, 7-day section, and disclaimer', () => {
    const markdown = buildForecastMarkdownReport({
      selectedLocation: { lat: 40.7128, lng: -74.006 },
      forecastDays: buildDays(),
      locale: 'en',
      generatedAtIso: '2026-05-01T10:15:00.000Z',
      labels: enLabels,
    });

    expect(markdown).toContain('# Bite forecast report');
    expect(markdown).toContain('## 7-day forecast');
    expect(markdown).toContain('## Disclaimer');
    expect(markdown).toContain(enLabels.disclaimer);
    expect(markdown).toContain('- Explanation: Stable weather window.');
    expect(markdown).toContain('- Factors:');
    expect(markdown).toContain('- Day 1');
    expect(markdown).toContain('- Point: 40.71280, -74.00600');
  });

  it('throws when forecast does not contain exactly dayOffset 0..6', () => {
    const incomplete = buildDays().slice(0, 6);

    expect(() =>
      buildForecastMarkdownReport({
        selectedLocation: { lat: 59.9391, lng: 30.3159 },
        forecastDays: incomplete,
        locale: 'en',
        generatedAtIso: '2026-05-01T10:15:00.000Z',
        labels: enLabels,
      }),
    ).toThrow('exactly 7 days are required');
  });
});
