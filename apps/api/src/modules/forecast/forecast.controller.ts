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

    return biteForecastResponseSchema.parse(this.forecastService.calculate(parsed.data));
  }
}
