import { NestFactory } from '@nestjs/core';
import { describe, expect, it } from 'vitest';

import { createOpenApiDocument } from './openapi';
import { OpenApiDocumentModule } from './scripts/openapi-document.module';

describe('OpenAPI document', () => {
  it('can be generated with key API paths', async () => {
    const app = await NestFactory.create(OpenApiDocumentModule, {
      logger: false,
    });
    const document = createOpenApiDocument(app);

    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining([
        '/health',
        '/profiles/{steamId}',
        '/profiles/{steamId}/summary',
        '/profiles/{steamId}/games',
        '/profiles/{steamId}/games/nearest-completions',
        '/profiles/{steamId}/games/{steamAppId}',
        '/profiles/{steamId}/games/{steamAppId}/achievements',
        '/profiles/{steamId}/achievements/rarest',
        '/profiles/{steamId}/sync-runs',
        '/profiles/{steamId}/sync',
      ]),
    );
    expect(
      document.paths['/profiles/{steamId}/sync']?.post?.operationId,
    ).toBe('enqueueProfileSync');
    expect(document.paths['/profiles/{steamId}/sync']?.post?.responses).toHaveProperty(
      '202',
    );
    expect(
      document.paths['/profiles/{steamId}/sync']?.post?.responses['202'],
    ).toMatchObject({
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/QueuedSyncResponseDto',
          },
        },
      },
    });
    expect(document.components?.schemas?.QueuedSyncResponseDto).toMatchObject({
      required: ['syncRunId', 'jobId', 'steamId', 'scope', 'status', 'queuedAt'],
      properties: {
        syncRunId: { type: 'string' },
        jobId: { type: 'string' },
        steamId: { type: 'string' },
        scope: { enum: ['profile', 'games', 'achievements'] },
        status: { enum: ['queued'] },
        queuedAt: { type: 'string' },
      },
    });
    expect(document.components?.schemas?.SyncRequestDto).toMatchObject({
      required: ['scope'],
      properties: {
        scope: { enum: ['profile', 'games', 'achievements'] },
        appIds: {
          type: 'array',
          items: { type: 'integer' },
        },
      },
    });
    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining([
        '/auth/steam/login',
        '/auth/steam/callback',
        '/auth/me',
        '/auth/logout',
        '/account/me',
        '/account/preferences',
        '/account/public-profile',
        '/public-profiles/{slug}',
      ]),
    );
    expect(document.paths['/auth/steam/login']?.get?.operationId).toBe(
      'startSteamLogin',
    );
    expect(
      document.paths['/auth/steam/callback']?.get?.operationId,
    ).toBe('handleSteamCallback');
    expect(document.paths['/auth/me']?.get?.operationId).toBe('getCurrentUser');
    expect(document.paths['/auth/logout']?.post?.operationId).toBe('logout');
    expect(document.paths['/account/me']?.get?.operationId).toBe('getAccountMe');
    expect(document.paths['/account/me']?.patch?.operationId).toBe(
      'updateAccountMe',
    );
    expect(document.paths['/account/preferences']?.get?.operationId).toBe(
      'getAccountPreferences',
    );
    expect(document.paths['/account/preferences']?.patch?.operationId).toBe(
      'updateAccountPreferences',
    );
    expect(document.paths['/account/public-profile']?.get?.operationId).toBe(
      'getAccountPublicProfile',
    );
    expect(document.paths['/account/public-profile']?.patch?.operationId).toBe(
      'updateAccountPublicProfile',
    );
    expect(document.paths['/public-profiles/{slug}']?.get?.operationId).toBe(
      'getPublicProfileBySlug',
    );

    await app.close();
  });
});
