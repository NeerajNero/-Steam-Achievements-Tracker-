import { ServiceUnavailableException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Queue } from 'bullmq';

import type { SyncRunsDataService } from '../../db/services/sync-runs-data.service';
import type { ProfilesService } from '../profiles/profiles.service';
import { SYNC_JOB_NAME } from '../queue/queue.constants';
import type { SyncJobData } from './sync-job.types';
import { SyncService } from './sync.service';

describe('SyncService queue producer', () => {
  let syncRunsDataService: {
    createRun: ReturnType<typeof vi.fn>;
    markFailed: ReturnType<typeof vi.fn>;
  };
  let profilesService: {
    findProfileBySteamId: ReturnType<typeof vi.fn>;
  };
  let syncQueue: {
    add: ReturnType<typeof vi.fn>;
  };
  let service: SyncService;

  beforeEach(() => {
    syncRunsDataService = {
      createRun: vi.fn(async () => createSyncRun()),
      markFailed: vi.fn(),
    };
    profilesService = {
      findProfileBySteamId: vi.fn(async () => ({ id: 'profile-id' })),
    };
    syncQueue = {
      add: vi.fn(async () => ({ id: 'job-id' })),
    };
    service = new SyncService(
      profilesService as unknown as ProfilesService,
      syncRunsDataService as unknown as SyncRunsDataService,
      syncQueue as unknown as Queue<SyncJobData>,
    );
  });

  it('enqueueSync creates a queued sync run and adds a BullMQ job', async () => {
    await expect(
      service.enqueueSync('76561198000000000', 'profile'),
    ).resolves.toEqual({
      syncRunId: 'sync-run-id',
      jobId: 'job-id',
      steamId: '76561198000000000',
      scope: 'profile',
      status: 'queued',
      queuedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(syncRunsDataService.createRun).toHaveBeenCalledWith({
      profileId: 'profile-id',
      syncType: 'profile',
      status: 'queued',
      metadata: {
        scope: 'profile',
        steamId: '76561198000000000',
      },
    });
    expect(syncQueue.add).toHaveBeenCalledWith(
      SYNC_JOB_NAME,
      {
        syncRunId: 'sync-run-id',
        steamId: '76561198000000000',
        scope: 'profile',
      },
      expect.objectContaining({
        attempts: 3,
        jobId: 'steam-sync-76561198000000000-profile-sync-run-id',
      }),
    );
  });

  it('enqueueSync creates an achievements sync run and queues app IDs', async () => {
    await expect(
      service.enqueueSync('76561198000000000', 'achievements', [
        910001,
        910002,
        910001,
      ]),
    ).resolves.toMatchObject({
      syncRunId: 'sync-run-id',
      jobId: 'job-id',
      steamId: '76561198000000000',
      scope: 'achievements',
      status: 'queued',
    });

    expect(syncRunsDataService.createRun).toHaveBeenCalledWith({
      profileId: 'profile-id',
      syncType: 'achievements',
      status: 'queued',
      metadata: {
        scope: 'achievements',
        steamId: '76561198000000000',
        appIds: [910001, 910002],
      },
    });
    expect(syncQueue.add).toHaveBeenCalledWith(
      SYNC_JOB_NAME,
      {
        syncRunId: 'sync-run-id',
        steamId: '76561198000000000',
        scope: 'achievements',
        appIds: [910001, 910002],
      },
      expect.objectContaining({
        attempts: 3,
        jobId: 'steam-sync-76561198000000000-achievements-sync-run-id',
      }),
    );
  });


  it('enqueueSync allows unknown profiles to queue without a profile id', async () => {
    profilesService.findProfileBySteamId.mockResolvedValue(null);

    await service.enqueueSync('76561198000000001', 'profile');

    expect(syncRunsDataService.createRun).toHaveBeenCalledWith({
      profileId: null,
      syncType: 'profile',
      status: 'queued',
      metadata: {
        scope: 'profile',
        steamId: '76561198000000001',
      },
    });
  });

  it('enqueueSync marks the sync run failed if enqueue fails', async () => {
    syncQueue.add.mockRejectedValue(new Error('redis unavailable'));

    await expect(
      service.enqueueSync('76561198000000000', 'games'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(syncRunsDataService.markFailed).toHaveBeenCalledWith(
      'sync-run-id',
      'Unable to enqueue sync job.',
      {
        scope: 'games',
        steamId: '76561198000000000',
      },
    );
  });
});

function createSyncRun() {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return {
    id: 'sync-run-id',
    profileId: null,
    syncType: 'profile',
    status: 'queued',
    startedAt: now,
    finishedAt: null,
    errorMessage: null,
    metadata: {},
    createdAt: now,
  };
}
