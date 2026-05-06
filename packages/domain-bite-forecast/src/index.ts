import * as Astronomy from 'astronomy-engine';

export type BiteForecastLevel = 'poor' | 'moderate' | 'good' | 'excellent';
export type ForecastConfidence = 'low' | 'medium' | 'high';
export type ForecastLocale = 'ru' | 'en';

export type BiteForecastFactor = {
  id: string;
  label: string;
  impact: number;
};

export type WeatherSnapshot = {
  pressureHpa: number;
  airTemperatureC: number;
  windSpeedMps: number;
  cloudCoverPct: number;
  precipitationMm: number;
};

export type WeatherHourlyEntry = WeatherSnapshot & {
  timestamp: string;
  windDirectionDeg?: number | undefined;
  precipitationProbabilityPct?: number | undefined;
};

export type BiteForecastInput = {
  point: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  timezone: string;
  weather: WeatherSnapshot;
  hourlyWeather?: WeatherHourlyEntry[] | undefined;
  locale?: ForecastLocale | undefined;
  debug?: boolean | undefined;
};

export type BiteForecastHourlyPoint = {
  timestamp: string;
  score: number;
  tags: string[];
};

export type BiteForecastWindow = {
  from: string;
  to: string;
  peakScore: number;
  tags: string[];
};

export type BiteForecastDebugBreakdown = {
  meteo: number;
  kSolunar: number;
  kLight: number;
  kSeason: number;
  quality: number;
};

export type BiteForecastExpanded = {
  dayMaxScore: number;
  dayMeanAboveThreshold: number;
  bestWindowThreshold: number;
  hourly: BiteForecastHourlyPoint[];
  bestWindows: BiteForecastWindow[];
  debugBreakdown?: BiteForecastDebugBreakdown[];
};

export type BiteForecastResult = {
  score: number;
  level: BiteForecastLevel;
  confidence: ForecastConfidence;
  factors: BiteForecastFactor[];
  strongestFactorId: string;
  explanationLocalized: {
    ru: string;
    en: string;
  };
  expanded?: BiteForecastExpanded;
};

const BEST_WINDOW_THRESHOLD = 72;

export function calculateBiteForecast(input: BiteForecastInput): BiteForecastResult {
  const hourlyWeather = buildHourlySeries(input);
  const seasonFactor = scoreSeason(input.timestamp);
  const astronomy = buildAstronomyContext(input);
  const hourly = hourlyWeather.map((entry) => scoreHour(entry, input.timezone, seasonFactor, astronomy));
  const dayMaxScore = Math.max(...hourly.map((item) => item.finalScore));
  const aboveThreshold = hourly.filter((item) => item.finalScore >= 60);
  const dayMeanAboveThreshold =
    aboveThreshold.length > 0
      ? roundToInt(aboveThreshold.reduce((sum, item) => sum + item.finalScore, 0) / aboveThreshold.length)
      : roundToInt(hourly.reduce((sum, item) => sum + item.finalScore, 0) / hourly.length);
  const score = clamp(roundToInt(0.7 * dayMaxScore + 0.3 * dayMeanAboveThreshold), 0, 100);
  const level = resolveLevel(score);
  const confidence = resolveConfidence(score, hourlyWeather.length / 24);

  const factors = summarizeDailyFactors(hourly, seasonFactor);
  const strongestFactor = factors.reduce((strongest, factor) =>
    Math.abs(factor.impact) > Math.abs(strongest.impact) ? factor : strongest,
  );

  const explanationLocalized = buildLocalizedExplanation(level, strongestFactor.label);

  const expandedBase: BiteForecastExpanded = {
    dayMaxScore,
    dayMeanAboveThreshold,
    bestWindowThreshold: BEST_WINDOW_THRESHOLD,
    hourly: hourly.map((item) => ({
      timestamp: item.timestamp,
      score: item.finalScore,
      tags: item.tags,
    })),
    bestWindows: buildBestWindows(hourly, BEST_WINDOW_THRESHOLD),
  };

  const expanded: BiteForecastExpanded = input.debug
    ? {
        ...expandedBase,
        debugBreakdown: hourly.map((item) => ({
          meteo: item.meteo,
          kSolunar: item.kSolunar,
          kLight: item.kLight,
          kSeason: item.kSeason,
          quality: item.quality,
        })),
      }
    : expandedBase;

  return {
    score,
    level,
    confidence,
    factors,
    strongestFactorId: strongestFactor.id,
    explanationLocalized,
    expanded,
  };
}

type HourScored = {
  timestamp: string;
  meteo: number;
  kSolunar: number;
  kLight: number;
  kSeason: number;
  quality: number;
  finalScore: number;
  tags: string[];
  pressure: number;
  wind: number;
  temperature: number;
  clouds: number;
  precipitation: number;
};

type AstronomyWindowKind = 'solunar-major' | 'solunar-minor' | 'sunrise' | 'sunset';

type AstronomyWindow = {
  fromMs: number;
  toMs: number;
  kind: AstronomyWindowKind;
};

type AstronomyContext = {
  windows: AstronomyWindow[];
};

function buildHourlySeries(input: BiteForecastInput): WeatherHourlyEntry[] {
  if (input.hourlyWeather && input.hourlyWeather.length >= 24) {
    return input.hourlyWeather.slice(0, 24);
  }

  const start = new Date(input.timestamp);
  const series: WeatherHourlyEntry[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    const ts = new Date(start);
    ts.setUTCHours(start.getUTCHours() + hour, 0, 0, 0);
    series.push({
      timestamp: ts.toISOString(),
      ...input.weather,
    });
  }
  return series;
}

function scoreHour(
  entry: WeatherHourlyEntry,
  timezone: string,
  seasonFactor: BiteForecastFactor,
  astronomy: AstronomyContext,
): HourScored {
  const pressure = scorePressure(entry.pressureHpa);
  const wind = scoreWind(entry.windSpeedMps);
  const temperature = scoreTemperature(entry.airTemperatureC);
  const clouds = scoreClouds(entry.cloudCoverPct);
  const precipitation = scorePrecipitation(entry.precipitationMm);

  const meteo = clamp(50 + pressure.impact + wind.impact + temperature.impact + clouds.impact + precipitation.impact, 0, 100);

  const localHour = getLocalHour(entry.timestamp, timezone);
  const kSolunar = resolveSolunarMultiplier(entry.timestamp, astronomy);
  const kLight = resolveLightMultiplier(entry.timestamp, astronomy);
  const kSeason = resolveSeasonMultiplier(seasonFactor.impact);
  const quality = 1;

  const finalScore = clamp(roundToInt(meteo * kSolunar * kLight * kSeason * quality), 0, 100);
  const tags = buildHourTags(entry.timestamp, localHour, pressure.impact, wind.impact, astronomy);

  return {
    timestamp: entry.timestamp,
    meteo,
    kSolunar,
    kLight,
    kSeason,
    quality,
    finalScore,
    tags,
    pressure: pressure.impact,
    wind: wind.impact,
    temperature: temperature.impact,
    clouds: clouds.impact,
    precipitation: precipitation.impact,
  };
}

function summarizeDailyFactors(hourly: HourScored[], seasonFactor: BiteForecastFactor): BiteForecastFactor[] {
  const averaged = {
    pressure: average(hourly.map((item) => item.pressure)),
    wind: average(hourly.map((item) => item.wind)),
    temperature: average(hourly.map((item) => item.temperature)),
    clouds: average(hourly.map((item) => item.clouds)),
    precipitation: average(hourly.map((item) => item.precipitation)),
  };

  const solunarImpact = roundToInt(average(hourly.map((item) => (item.kSolunar - 1) * 30)));
  const lightImpact = roundToInt(average(hourly.map((item) => (item.kLight - 1) * 25)));

  return [
    { id: 'pressure', label: averaged.pressure >= 0 ? 'Стабильное давление' : 'Перепады давления', impact: averaged.pressure },
    { id: 'wind', label: averaged.wind >= 0 ? 'Благоприятный ветер' : 'Неблагоприятный ветер', impact: averaged.wind },
    {
      id: 'temperature',
      label: averaged.temperature >= 0 ? 'Комфортная температура' : 'Стрессовая температура',
      impact: averaged.temperature,
    },
    { id: 'clouds', label: averaged.clouds >= 0 ? 'Рабочая облачность' : 'Нейтральная облачность', impact: averaged.clouds },
    {
      id: 'precipitation',
      label: averaged.precipitation >= 0 ? 'Умеренные осадки/сухо' : 'Интенсивные осадки',
      impact: averaged.precipitation,
    },
    { id: 'solunar', label: solunarImpact >= 0 ? 'Солунарные окна активности' : 'Вне солунарных окон', impact: solunarImpact },
    { id: 'light', label: lightImpact >= 0 ? 'Окна рассвета/заката' : 'Нейтральный световой режим', impact: lightImpact },
    seasonFactor,
  ];
}

function buildBestWindows(hourly: HourScored[], threshold: number): BiteForecastWindow[] {
  const windows: BiteForecastWindow[] = [];
  let current: HourScored[] = [];

  for (const point of hourly) {
    if (point.finalScore >= threshold) {
      current.push(point);
      continue;
    }

    if (current.length > 0) {
      windows.push(toWindow(current));
      current = [];
    }
  }

  if (current.length > 0) {
    windows.push(toWindow(current));
  }

  return windows;
}

function toWindow(points: HourScored[]): BiteForecastWindow {
  const peakScore = Math.max(...points.map((item) => item.finalScore));
  const tags = Array.from(new Set(points.flatMap((item) => item.tags)));
  return {
    from: points[0]?.timestamp ?? new Date(0).toISOString(),
    to: points[points.length - 1]?.timestamp ?? new Date(0).toISOString(),
    peakScore,
    tags,
  };
}

function resolveLevel(score: number): BiteForecastLevel {
  if (score >= 80) {
    return 'excellent';
  }
  if (score >= 60) {
    return 'good';
  }
  if (score >= 40) {
    return 'moderate';
  }
  return 'poor';
}

function resolveConfidence(score: number, qualityCoverage: number): ForecastConfidence {
  const offset = Math.abs(score - 50);
  if (qualityCoverage < 0.7) {
    return 'low';
  }
  if (offset >= 25) {
    return 'high';
  }
  if (offset >= 15) {
    return 'medium';
  }
  return 'low';
}

function buildLocalizedExplanation(level: BiteForecastLevel, strongestLabel: string) {
  const ruPrefix =
    level === 'excellent' ? 'Очень активный' : level === 'good' ? 'Хороший' : level === 'moderate' ? 'Средний' : 'Слабый';
  const enPrefix =
    level === 'excellent'
      ? 'Very active'
      : level === 'good'
        ? 'Good'
        : level === 'moderate'
          ? 'Moderate'
          : 'Weak';

  return {
    ru: `${ruPrefix} клёв: ключевой фактор — ${strongestLabel.toLowerCase()}.`,
    en: `${enPrefix} bite: key factor is ${translateFactorToEnglish(strongestLabel)}.`,
  };
}

function translateFactorToEnglish(label: string): string {
  const map: Record<string, string> = {
    'Стабильное давление': 'stable pressure',
    'Перепады давления': 'pressure volatility',
    'Благоприятный ветер': 'favorable wind',
    'Неблагоприятный ветер': 'unfavorable wind',
    'Комфортная температура': 'comfortable temperature',
    'Стрессовая температура': 'stress temperature',
    'Рабочая облачность': 'favorable cloud cover',
    'Нейтральная облачность': 'neutral cloud cover',
    'Умеренные осадки/сухо': 'light precipitation / dry weather',
    'Интенсивные осадки': 'heavy precipitation',
    'Солунарные окна активности': 'solunar activity windows',
    'Вне солунарных окон': 'outside solunar windows',
    'Окна рассвета/заката': 'sunrise/sunset windows',
    'Нейтральный световой режим': 'neutral light conditions',
    'Весенний/осенний сезонный плюс': 'spring/autumn seasonal boost',
    'Летний нейтральный сезон': 'summer neutral season',
    'Зимний сезонный спад': 'winter seasonal slowdown',
  };
  return map[label] ?? 'environmental conditions';
}

function scorePressure(pressureHpa: number): BiteForecastFactor {
  if (pressureHpa >= 1010 && pressureHpa <= 1020) {
    return { id: 'pressure', label: 'Стабильное давление', impact: 12 };
  }
  if (pressureHpa >= 1000 && pressureHpa <= 1026) {
    return { id: 'pressure', label: 'Умеренно стабильное давление', impact: 4 };
  }
  return { id: 'pressure', label: 'Перепады давления', impact: -10 };
}

function scoreWind(windSpeedMps: number): BiteForecastFactor {
  if (windSpeedMps >= 0.5 && windSpeedMps <= 4) {
    return { id: 'wind', label: 'Благоприятный ветер', impact: 10 };
  }
  if (windSpeedMps <= 7) {
    return { id: 'wind', label: 'Умеренный ветер', impact: 2 };
  }
  return { id: 'wind', label: 'Неблагоприятный ветер', impact: -12 };
}

function scoreTemperature(temperatureC: number): BiteForecastFactor {
  if (temperatureC >= 12 && temperatureC <= 22) {
    return { id: 'temperature', label: 'Комфортная температура', impact: 11 };
  }
  if (temperatureC >= 5 && temperatureC <= 28) {
    return { id: 'temperature', label: 'Допустимая температура', impact: 3 };
  }
  return { id: 'temperature', label: 'Стрессовая температура', impact: -14 };
}

function scoreClouds(cloudCoverPct: number): BiteForecastFactor {
  if (cloudCoverPct >= 20 && cloudCoverPct <= 70) {
    return { id: 'clouds', label: 'Рабочая облачность', impact: 6 };
  }
  return { id: 'clouds', label: 'Нейтральная облачность', impact: 0 };
}

function scorePrecipitation(precipitationMm: number): BiteForecastFactor {
  if (precipitationMm === 0) {
    return { id: 'precipitation', label: 'Без осадков', impact: 4 };
  }
  if (precipitationMm < 2) {
    return { id: 'precipitation', label: 'Лёгкие осадки', impact: 1 };
  }
  return { id: 'precipitation', label: 'Интенсивные осадки', impact: -8 };
}

function scoreSeason(timestamp: string): BiteForecastFactor {
  const month = new Date(timestamp).getUTCMonth() + 1;
  if (month === 3 || month === 4 || month === 5 || month === 9 || month === 10 || month === 11) {
    return { id: 'season', label: 'Весенний/осенний сезонный плюс', impact: 4 };
  }
  if (month === 6 || month === 7 || month === 8) {
    return { id: 'season', label: 'Летний нейтральный сезон', impact: 1 };
  }
  return { id: 'season', label: 'Зимний сезонный спад', impact: -3 };
}

function resolveSeasonMultiplier(impact: number): number {
  if (impact >= 4) {
    return 1.1;
  }
  if (impact <= -3) {
    return 0.9;
  }
  return 1;
}

function resolveSolunarMultiplier(timestamp: string, astronomy: AstronomyContext): number {
  const ts = new Date(timestamp).getTime();
  let result = 0.95;

  for (const window of astronomy.windows) {
    if (window.kind !== 'solunar-major' && window.kind !== 'solunar-minor') {
      continue;
    }

    if (ts >= window.fromMs && ts <= window.toMs) {
      result = Math.max(result, window.kind === 'solunar-major' ? 1.4 : 1.15);
    }
  }

  return result;
}

function resolveLightMultiplier(timestamp: string, astronomy: AstronomyContext): number {
  const ts = new Date(timestamp).getTime();

  for (const window of astronomy.windows) {
    if (window.kind !== 'sunrise' && window.kind !== 'sunset') {
      continue;
    }

    if (ts >= window.fromMs && ts <= window.toMs) {
      return 1.2;
    }
  }

  return 1;
}

function buildHourTags(
  timestamp: string,
  localHour: number,
  pressureImpact: number,
  windImpact: number,
  astronomy: AstronomyContext,
): string[] {
  const ts = new Date(timestamp).getTime();
  const tags: string[] = [];

  const inMajor = astronomy.windows.some(
    (window) => window.kind === 'solunar-major' && ts >= window.fromMs && ts <= window.toMs,
  );
  const inMinor = astronomy.windows.some(
    (window) => window.kind === 'solunar-minor' && ts >= window.fromMs && ts <= window.toMs,
  );
  const inSunrise = astronomy.windows.some(
    (window) => window.kind === 'sunrise' && ts >= window.fromMs && ts <= window.toMs,
  );
  const inSunset = astronomy.windows.some(
    (window) => window.kind === 'sunset' && ts >= window.fromMs && ts <= window.toMs,
  );

  if (inMajor || inMinor) {
    tags.push('solunar');
  }
  if (inSunrise || (localHour <= 10 && inMajor)) {
    tags.push('sunrise');
  }
  if (inSunset || (localHour >= 16 && inMajor)) {
    tags.push('sunset');
  }
  if (pressureImpact > 0) {
    tags.push('stable_pressure');
  }
  if (windImpact > 0) {
    tags.push('favorable_wind');
  }

  return tags;
}

function buildAstronomyContext(input: BiteForecastInput): AstronomyContext {
  const observer = new Astronomy.Observer(input.point.lat, input.point.lng, 0);
  const dayStart = new Date(input.timestamp);
  dayStart.setUTCHours(0, 0, 0, 0);

  const windows: AstronomyWindow[] = [];

  appendWindow(windows, safeAstroDate(Astronomy.SearchHourAngle(Astronomy.Body.Moon, observer, 0, dayStart, +1)), 120, 'solunar-major');
  appendWindow(windows, safeAstroDate(Astronomy.SearchHourAngle(Astronomy.Body.Moon, observer, 12, dayStart, +1)), 120, 'solunar-major');
  appendWindow(windows, safeAstroDate(Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, +1, dayStart, 2)), 90, 'solunar-minor');
  appendWindow(windows, safeAstroDate(Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, -1, dayStart, 2)), 90, 'solunar-minor');
  appendWindow(windows, safeAstroDate(Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, dayStart, 2)), 90, 'sunrise');
  appendWindow(windows, safeAstroDate(Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, dayStart, 2)), 90, 'sunset');

  return { windows };
}

function safeAstroDate(value: Astronomy.AstroTime | Astronomy.HourAngleEvent | null): Date | null {
  if (!value) {
    return null;
  }

  try {
    return 'time' in value ? value.time.date : value.date;
  } catch {
    return null;
  }
}

function appendWindow(
  windows: AstronomyWindow[],
  center: Date | null,
  halfRangeMinutes: number,
  kind: AstronomyWindowKind,
) {
  if (!center) {
    return;
  }

  const centerMs = center.getTime();
  const spanMs = halfRangeMinutes * 60 * 1000;
  windows.push({
    fromMs: centerMs - spanMs,
    toMs: centerMs + spanMs,
    kind,
  });
}

function getLocalHour(timestamp: string, timezone: string): number {
  const date = new Date(timestamp);
  try {
    const hourPart = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      hour12: false,
      timeZone: timezone,
    })
      .formatToParts(date)
      .find((part) => part.type === 'hour')?.value;
    return hourPart ? Number(hourPart) : date.getUTCHours();
  } catch {
    return date.getUTCHours();
  }
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return roundToInt(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function roundToInt(value: number): number {
  return Math.round(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
