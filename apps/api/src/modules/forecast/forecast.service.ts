import { Injectable } from '@nestjs/common';

import { calculateBiteForecast } from '@fishing/domain-bite-forecast';
import type { BiteForecastRequest } from '@fishing/shared-zod';

@Injectable()
export class ForecastService {
  calculate(input: BiteForecastRequest) {
    return calculateBiteForecast(input);
  }
}
