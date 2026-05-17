import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { setupOpenApi, shouldEnableOpenApi } from './openapi';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  if (shouldEnableOpenApi()) {
    setupOpenApi(app);
  }

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

void bootstrap();

function getCorsOrigins(): string[] {
  const configuredOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (configuredOrigins !== undefined && configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  return ['http://localhost:3001'];
}
