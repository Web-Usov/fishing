import type { BiteForecastResponse, ForecastConfidence, WeatherSnapshot } from '@fishing/shared-zod';

import type { AppLocale } from './locale/LocaleProvider';
import type { SelectedLocation } from './runtime';

type ReportDayInput = {
  dayOffset: number;
  timestamp: string;
  response: BiteForecastResponse;
  weather: WeatherSnapshot;
};

type ReportLabels = {
  title: string;
  generatedAtLabel: string;
  generatedForLabel: string;
  pointLabel: string;
  latitudeLabel: string;
  longitudeLabel: string;
  waterbodyTypeLabel: string;
  section7dLabel: string;
  dayLabel: string;
  dateLabel: string;
  scoreLabel: string;
  levelLabel: string;
  confidenceLabel: string;
  temperatureLabel: string;
  pressureLabel: string;
  windLabel: string;
  explanationLabel: string;
  factorsLabel: string;
  disclaimerTitle: string;
  disclaimer: string;
  confidenceLabels: Record<ForecastConfidence, string>;
  levelLabels: Record<BiteForecastResponse['level'], string>;
};

export type BuildForecastMarkdownReportInput = {
  selectedLocation: SelectedLocation;
  forecastDays: ReportDayInput[];
  locale: AppLocale;
  generatedAtIso: string;
  labels: ReportLabels;
  pointName?: string;
  waterbodyType?: string;
};

const REQUIRED_DAY_OFFSETS = [0, 1, 2, 3, 4, 5, 6] as const;

function resolveLocaleTag(locale: AppLocale) {
  return locale === 'ru' ? 'ru-RU' : 'en-US';
}

function formatDateTime(iso: string, locale: AppLocale) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ISO date-time: ${iso}`);
  }

  return new Intl.DateTimeFormat(resolveLocaleTag(locale), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function formatDate(iso: string, locale: AppLocale) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ISO date: ${iso}`);
  }

  return new Intl.DateTimeFormat(resolveLocaleTag(locale), {
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

function assertValidSevenDaySeries(days: ReportDayInput[]) {
  if (days.length !== REQUIRED_DAY_OFFSETS.length) {
    throw new Error('Incomplete forecast data: exactly 7 days are required.');
  }

  const offsets = new Set(days.map((day) => day.dayOffset));
  for (const expectedOffset of REQUIRED_DAY_OFFSETS) {
    if (!offsets.has(expectedOffset)) {
      throw new Error(`Incomplete forecast data: missing dayOffset ${expectedOffset}.`);
    }
  }
}

export function buildForecastMarkdownReport(input: BuildForecastMarkdownReportInput): string {
  assertValidSevenDaySeries(input.forecastDays);

  const orderedDays = [...input.forecastDays].sort((a, b) => a.dayOffset - b.dayOffset);
  const firstDay = orderedDays[0];
  if (!firstDay) {
    throw new Error('Incomplete forecast data: first day is missing after validation.');
  }

  const titleSection = `# ${input.labels.title}`;

  const generationMetadataSection = [
    `## ${input.labels.generatedAtLabel}`,
    `- ${input.labels.generatedAtLabel}: ${formatDateTime(input.generatedAtIso, input.locale)}`,
    `- ${input.labels.generatedForLabel}: ${formatDateTime(firstDay.timestamp, input.locale)}`,
  ].join('\n');

  const pointMetadataSection = [
    `## ${input.labels.pointLabel}`,
    `- ${input.labels.pointLabel}: ${input.pointName ?? `${input.selectedLocation.lat.toFixed(5)}, ${input.selectedLocation.lng.toFixed(5)}`}`,
    `- ${input.labels.latitudeLabel}: ${input.selectedLocation.lat.toFixed(5)}`,
    `- ${input.labels.longitudeLabel}: ${input.selectedLocation.lng.toFixed(5)}`,
    input.waterbodyType ? `- ${input.labels.waterbodyTypeLabel}: ${input.waterbodyType}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  const summarySection = [
    `## ${input.labels.section7dLabel}`,
    ...orderedDays.map((day) => {
      const level = input.labels.levelLabels[day.response.level];
      const confidence = input.labels.confidenceLabels[day.response.confidence];
      return `- ${input.labels.dayLabel} ${day.dayOffset + 1} (${formatDate(day.timestamp, input.locale)}): ${input.labels.scoreLabel} ${day.response.score}, ${input.labels.levelLabel} ${level}, ${input.labels.confidenceLabel} ${confidence}`;
    }),
  ].join('\n');

  const perDayDetailsSection = orderedDays
    .map((day) => {
      const level = input.labels.levelLabels[day.response.level];
      const confidence = input.labels.confidenceLabels[day.response.confidence];
      const factors = day.response.factors.map((factor) => `  - ${factor.label}: ${factor.impact >= 0 ? `+${factor.impact}` : factor.impact}`).join('\n');

      return [
        `## ${input.labels.dayLabel} ${day.dayOffset + 1}`,
        `- ${input.labels.dateLabel}: ${formatDate(day.timestamp, input.locale)}`,
        `- ${input.labels.scoreLabel}: ${day.response.score}`,
        `- ${input.labels.levelLabel}: ${level}`,
        `- ${input.labels.confidenceLabel}: ${confidence}`,
        `- ${input.labels.temperatureLabel}: ${day.weather.airTemperatureC}°C`,
        `- ${input.labels.pressureLabel}: ${day.weather.pressureHpa} hPa`,
        `- ${input.labels.windLabel}: ${day.weather.windSpeedMps} m/s`,
        `- ${input.labels.explanationLabel}: ${day.response.explanation}`,
        `- ${input.labels.factorsLabel}:`,
        factors,
      ].join('\n');
    })
    .join('\n\n');

  const disclaimerSection = [
    `## ${input.labels.disclaimerTitle}`,
    input.labels.disclaimer,
  ].join('\n');

  return [
    titleSection,
    generationMetadataSection,
    pointMetadataSection,
    summarySection,
    perDayDetailsSection,
    disclaimerSection,
  ].join('\n\n');
}
