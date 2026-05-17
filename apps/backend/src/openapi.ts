import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Steam Achievement Tracker API')
    .setDescription(
      'API for syncing and reading Steam achievement intelligence data',
    )
    .setVersion('0.1.0')
    .addTag('health')
    .addTag('profiles')
    .addTag('games')
    .addTag('achievements')
    .addTag('sync')
    .addTag('auth')
    .addServer('http://localhost:3000', 'Local Docker backend')
    .build();

  return SwaggerModule.createDocument(app, config);
}

export function setupOpenApi(app: INestApplication): void {
  const document = createOpenApiDocument(app);

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'openapi.json',
  });
}

export function shouldEnableOpenApi(): boolean {
  if (process.env.OPENAPI_ENABLED === 'false') {
    return false;
  }

  if (process.env.NODE_ENV === 'production') {
    return process.env.OPENAPI_ENABLED === 'true';
  }

  return true;
}
