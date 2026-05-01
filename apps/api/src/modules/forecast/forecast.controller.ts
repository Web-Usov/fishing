import { BadRequestException, Body, Controller, Inject, Post } from '@nestjs/common';

import {
  biteForecastRequestSchema,
  biteForecastResponseSchema,
} from '@fishing/shared-zod';

import { ForecastService } from './forecast.service';

@Controller('forecast')
export class ForecastController {
  constructor(@Inject(ForecastService) private readonly forecastService: ForecastService) {}

  @Post('calculate')
  calculate(@Body() body: unknown) {
    const parsed = biteForecastRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const forecast = this.forecastService.calculate(parsed.data);
    const strongestFactor =
      forecast.factors.find((factor) => factor.id === forecast.strongestFactorId) ?? forecast.factors[0];

    const explanationPrefix =
      forecast.level === 'excellent'
        ? 'Очень активный'
        : forecast.level === 'good'
          ? 'Хороший'
          : forecast.level === 'moderate'
            ? 'Средний'
            : 'Слабый';

    const explanation = `${explanationPrefix} клёв: ключевой фактор — ${strongestFactor?.label.toLowerCase() ?? 'условия среды'}.`;

    return biteForecastResponseSchema.parse({
      ...forecast,
      explanation,
    });
  }
}
