import { biteForecastResponseSchema, type BiteForecastRequest } from '@fishing/shared-zod';

export async function fetchBiteForecast(apiBaseUrl: string, payload: BiteForecastRequest) {
  const response = await fetch(`${apiBaseUrl}/forecast/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();
  return biteForecastResponseSchema.parse(json);
}
