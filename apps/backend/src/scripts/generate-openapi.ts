import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { NestFactory } from '@nestjs/core';

import { createOpenApiDocument } from '../openapi';
import { OpenApiDocumentModule } from './openapi-document.module';

const OPENAPI_OUTPUT_PATH = resolve(
  process.cwd(),
  '../../docs/openapi/openapi.json',
);

async function main(): Promise<void> {
  const app = await NestFactory.create(OpenApiDocumentModule, {
    logger: false,
  });
  const document = createOpenApiDocument(app);

  await mkdir(dirname(OPENAPI_OUTPUT_PATH), { recursive: true });
  await writeFile(
    OPENAPI_OUTPUT_PATH,
    `${JSON.stringify(document, null, 2)}\n`,
    'utf8',
  );
  await app.close();

  console.log(`OpenAPI JSON written to ${OPENAPI_OUTPUT_PATH}`);
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown OpenAPI generation error';
  console.error(`OpenAPI generation failed: ${message}`);
  process.exitCode = 1;
});
