import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    (
      request: { method: string },
      response: { header: (name: string, value: string) => void; sendStatus: (code: number) => void },
      next: () => void,
    ) => {
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (request.method === 'OPTIONS') {
      response.sendStatus(204);
      return;
    }

    next();
    },
  );
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001);
}

void bootstrap();
