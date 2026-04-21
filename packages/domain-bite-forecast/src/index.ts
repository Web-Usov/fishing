import {
  biteForecastResponseSchema,
  type BiteForecastFactor,
  type BiteForecastRequest,
  type BiteForecastResponse,
} from '@fishing/shared-zod';

export function calculateBiteForecast(input: BiteForecastRequest): BiteForecastResponse {
  const factors: [
    BiteForecastFactor,
    BiteForecastFactor,
    BiteForecastFactor,
    BiteForecastFactor,
    BiteForecastFactor,
    BiteForecastFactor,
    BiteForecastFactor,
  ] = [
    scorePressure(input.weather.pressureHpa),
    scoreWind(input.weather.windSpeedMps),
    scoreTemperature(input.weather.airTemperatureC),
    scoreClouds(input.weather.cloudCoverPct),
    scorePrecipitation(input.weather.precipitationMm),
    scoreMoon(input.weather.moonIlluminationPct),
    scoreWaterbody(input.waterbodyType),
  ];

  const rawScore = 50 + factors.reduce((sum, factor) => sum + factor.impact, 0);
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const level =
    score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'moderate' : 'poor';
  const confidence = score >= 70 || score <= 30 ? 'high' : score >= 45 ? 'medium' : 'low';
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

function scoreMoon(moonIlluminationPct: number): BiteForecastFactor {
  if (moonIlluminationPct >= 25 && moonIlluminationPct <= 75) {
    return { id: 'moon', label: 'Сбалансированная лунная фаза', impact: 5 };
  }

  return { id: 'moon', label: 'Крайняя лунная фаза', impact: -3 };
}

function scoreWaterbody(waterbodyType: BiteForecastRequest['waterbodyType']): BiteForecastFactor {
  switch (waterbodyType) {
    case 'lake':
      return { id: 'waterbody', label: 'Озёрный паттерн', impact: 5 };
    case 'reservoir':
      return { id: 'waterbody', label: 'Водохранилищный паттерн', impact: 3 };
    case 'pond':
      return { id: 'waterbody', label: 'Прудовой паттерн', impact: 2 };
    case 'river':
      return { id: 'waterbody', label: 'Речной паттерн', impact: 0 };
  }
}
