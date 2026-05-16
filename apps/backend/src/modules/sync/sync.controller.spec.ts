import { HttpStatus } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';

import { SyncScopeDto } from './dto/sync-request.dto';
import { SyncController } from './sync.controller';
import type { SyncService } from './sync.service';

describe('SyncController', () => {
  it('POST /profiles/:steamId/sync returns a queued response with HTTP 202 metadata', async () => {
    const syncService = {
      syncByScope: vi.fn(async () => ({
        syncRunId: 'sync-run-id',
        jobId: 'job-id',
        steamId: '76561198000000000',
        scope: 'profile',
        status: 'queued',
        queuedAt: '2026-01-01T00:00:00.000Z',
      })),
    };
    const controller = new SyncController(syncService as unknown as SyncService);

    await expect(
      controller.syncProfile(
        { steamId: '76561198000000000' },
        { scope: SyncScopeDto.Profile },
      ),
    ).resolves.toEqual({
      syncRunId: 'sync-run-id',
      jobId: 'job-id',
      steamId: '76561198000000000',
      scope: 'profile',
      status: 'queued',
      queuedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(syncService.syncByScope).toHaveBeenCalledWith(
      '76561198000000000',
      { scope: SyncScopeDto.Profile },
    );
    expect(
      Reflect.getMetadata(HTTP_CODE_METADATA, controller.syncProfile),
    ).toBe(HttpStatus.ACCEPTED);
  });

  it('POST /profiles/:steamId/sync accepts achievements scope and app IDs', async () => {
    const syncService = {
      syncByScope: vi.fn(async () => ({
        syncRunId: 'sync-run-id',
        jobId: 'job-id',
        steamId: '76561198000000000',
        scope: 'achievements',
        status: 'queued',
        queuedAt: '2026-01-01T00:00:00.000Z',
      })),
    };
    const controller = new SyncController(syncService as unknown as SyncService);

    await expect(
      controller.syncProfile(
        { steamId: '76561198000000000' },
        { scope: SyncScopeDto.Achievements, appIds: [910001] },
      ),
    ).resolves.toMatchObject({
      scope: 'achievements',
      status: 'queued',
    });
    expect(syncService.syncByScope).toHaveBeenCalledWith(
      '76561198000000000',
      { scope: SyncScopeDto.Achievements, appIds: [910001] },
    );
  });
});
