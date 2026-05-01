import {
  biteForecastResponseSchema,
  type BiteForecastFactor,
  type BiteForecastRequest,
  type BiteForecastResponse,
} from '@fishing/shared-zod';

export function calculateBiteForecast(input: BiteForecastRequest): BiteForecastResponse {
  const factors: BiteForecastFactor[] = [
    scorePressure(input.weather.pressureHpa),
    scoreWind(input.weather.windSpeedMps),
    scoreTemperature(input.weather.airTemperatureC),
    scoreClouds(input.weather.cloudCoverPct),
    scorePrecipitation(input.weather.precipitationMm),
    scoreTimeOfDay(input.timestamp, input.timezone),
    scoreSeason(input.timestamp),
  ];

  const rawScore = 50 + factors.reduce((sum, factor) => sum + factor.impact, 0);
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const level =
    score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'moderate' : 'poor';
  const offset = Math.abs(score - 50);
  const confidence = offset >= 25 ? 'high' : offset >= 15 ? 'medium' : 'low';
  const strongestFactor = factors.reduce((strongest, factor) =>
    Math.abs(factor.impact) > Math.abs(strongest.impact) ? factor : strongest,
  );

  return biteForecastResponseSchema.parse({
    score,
    level,
    confidence,
    factors,
    explanation: `${level === 'excellent' ? 'Очень активный' : level === 'good' ? 'Хороший' : level === 'moderate' ? 'Средний' : 'Слабый'} клёв: ключевой фактор — ${strongestFactor.label.toLowerCase()}.`,
  });
}

function scorePressure(pressureHpa: number): BiteForecastFactor {
  if (pressureHpa >= 1008 && pressureHpa <= 1022) {
    return { id: 'pressure', label: 'Стабильное давление', impact: 12 };
  }

  return { id: 'pressure', label: 'Нестабильное давление', impact: -10 };
}

function scoreWind(windSpeedMps: number): BiteForecastFactor {
  if (windSpeedMps <= 3) {
    return { id: 'wind', label: 'Слабый ветер', impact: 10 };
  }

  if (windSpeedMps <= 7) {
    return { id: 'wind', label: 'Умеренный ветер', impact: 2 };
  }

  return { id: 'wind', label: 'Сильный ветер', impact: -12 };
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
    return { id: 'clouds', label: 'Умеренная облачность', impact: 6 };
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

function scoreTimeOfDay(timestamp: string, timezone: string): BiteForecastFactor {
  const localHour = getLocalHour(timestamp, timezone);

  if (localHour >= 4 && localHour <= 8) {
    return { id: 'timeOfDay', label: 'Утренний выход рыбы', impact: 9 };
  }

  if (localHour >= 18 && localHour <= 22) {
    return { id: 'timeOfDay', label: 'Вечерняя активность рыбы', impact: 6 };
  }

  if (localHour >= 11 && localHour <= 16) {
    return { id: 'timeOfDay', label: 'Дневная пассивность рыбы', impact: -4 };
  }

  if (localHour >= 23 || localHour <= 3) {
    return { id: 'timeOfDay', label: 'Ночная пассивность рыбы', impact: -9 };
  }

  if (localHour >= 9 && localHour <= 10) {
    return { id: 'timeOfDay', label: 'Переход после рассвета', impact: 1 };
  }

  return { id: 'timeOfDay', label: 'Нейтральный суточный ритм', impact: 0 };
}

function scoreSeason(timestamp: string): BiteForecastFactor {
  const month = new Date(timestamp).getUTCMonth() + 1;

  if (month === 3 || month === 4 || month === 5) {
    return { id: 'season', label: 'Весенний период активности', impact: 4 };
  }

  if (month === 9 || month === 10 || month === 11) {
    return { id: 'season', label: 'Осенний период активности', impact: 4 };
  }

  if (month === 6 || month === 7 || month === 8) {
    return { id: 'season', label: 'Летний стабильный режим', impact: 1 };
  }

  return { id: 'season', label: 'Зимняя пассивность рыбы', impact: -3 };
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
