import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Queue } from 'bullmq';

import {
  getSyncQueueName,
} from '../queue/queue.config';
import { SYNC_JOB_NAME } from '../queue/queue.constants';
import {
  SyncRunsDataService,
  type SyncRun,
} from '../../db/services/sync-runs-data.service';
import { ProfilesService } from '../profiles/profiles.service';
import type { LimitQueryDto } from '../games/dto/limit-query.dto';
import type { QueuedSyncResponseDto } from './dto/queued-sync-response.dto';
import type { SyncRequestDto, SyncScope } from './dto/sync-request.dto';
import type {
  SyncHistoryItemResponseDto,
  SyncHistoryResponseDto,
} from './dto/sync-history-response.dto';
import type { SyncJobData } from './sync-job.types';

@Injectable()
export class SyncService {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly syncRunsDataService: SyncRunsDataService,
    @InjectQueue(getSyncQueueName())
    private readonly syncQueue: Queue<SyncJobData>,
  ) {}

  async getSyncRuns(
    steamId: string,
    query: LimitQueryDto,
  ): Promise<SyncHistoryResponseDto> {
    const profile = await this.profilesService.resolveProfile(steamId);
    const rows = await this.syncRunsDataService.findLatestByProfile(
      profile.id,
      query.limit,
    );

    return {
      steamId: profile.steamId,
      items: rows.map(mapSyncRun),
    };
  }

  async syncByScope(
    steamId: string,
    input: SyncRequestDto,
  ): Promise<QueuedSyncResponseDto> {
    return this.enqueueSync(steamId, input.scope, input.appIds);
  }

  async enqueueSync(
    steamId: string,
    scope: SyncScope,
    appIds?: number[],
  ): Promise<QueuedSyncResponseDto> {
    const normalizedAppIds =
      scope === 'achievements' ? normalizeAppIds(appIds) : undefined;
    const existingProfile = await this.profilesService.findProfileBySteamId(
      steamId,
    );
    const metadata = buildQueuedMetadata(scope, steamId, normalizedAppIds);
    const jobData = buildJobData('pending', steamId, scope, normalizedAppIds);
    const syncRun = await this.syncRunsDataService.createRun({
      profileId: existingProfile?.id ?? null,
      syncType: scope,
      status: 'queued',
      metadata,
    });

    try {
      const job = await this.syncQueue.add(
        SYNC_JOB_NAME,
        {
          ...jobData,
          syncRunId: syncRun.id,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1_000,
          },
          jobId: `steam-sync-${steamId}-${scope}-${syncRun.id}`,
          removeOnComplete: 100,
          removeOnFail: false,
        },
      );

      return {
        syncRunId: syncRun.id,
        jobId: String(job.id),
        steamId,
        scope,
        status: 'queued',
        queuedAt: syncRun.startedAt.toISOString(),
      };
    } catch {
      await this.syncRunsDataService.markFailed(
        syncRun.id,
        'Unable to enqueue sync job.',
        metadata,
      );

      throw new ServiceUnavailableException('Unable to enqueue sync job.');
    }
  }
}

function mapSyncRun(row: SyncRun): SyncHistoryItemResponseDto {
  return {
    id: row.id,
    syncType: row.syncType,
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    finishedAt: toIsoOrNull(row.finishedAt),
    errorMessage: row.errorMessage,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
  };
}

function normalizeAppIds(appIds: number[] | undefined): number[] | undefined {
  if (appIds === undefined) {
    return undefined;
  }

  return [...new Set(appIds)];
}

function buildQueuedMetadata(
  scope: SyncScope,
  steamId: string,
  appIds: number[] | undefined,
): Record<string, unknown> {
  return appIds === undefined
    ? { scope, steamId }
    : { scope, steamId, appIds };
}

function buildJobData(
  syncRunId: string,
  steamId: string,
  scope: SyncScope,
  appIds: number[] | undefined,
): SyncJobData {
  return appIds === undefined
    ? { syncRunId, steamId, scope }
    : { syncRunId, steamId, scope, appIds };
}

function toIsoOrNull(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}
