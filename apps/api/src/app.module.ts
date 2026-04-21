import { Module } from '@nestjs/common';

import { ForecastModule } from './modules/forecast/forecast.module';

@Module({
  imports: [ForecastModule],
})
export class AppModule {}
