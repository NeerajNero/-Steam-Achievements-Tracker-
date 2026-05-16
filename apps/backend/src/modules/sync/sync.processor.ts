import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { getSyncQueueName } from '../queue/queue.config';
import { SyncRunsDataService } from '../../db/services/sync-runs-data.service';
import type { SyncJobData } from './sync-job.types';
import {
  SyncWorkflowService,
  toSafeSyncErrorMessage,
} from './sync-workflow.service';

@Injectable()
@Processor(getSyncQueueName(), { concurrency: 2 })
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(
    private readonly syncWorkflowService: SyncWorkflowService,
    private readonly syncRunsDataService: SyncRunsDataService,
  ) {
    super();
  }

  async process(job: Job<SyncJobData>): Promise<void> {
    const context = buildLogContext(job);
    this.logger.log(`Sync job started ${context}`);
    await this.syncRunsDataService.markRunning(job.data.syncRunId);
    this.logger.log(`Sync run marked running ${context}`);

    try {
      await this.syncWorkflowService.execute(job.data);
      this.logger.log(`Sync job completed ${context}`);
    } catch (error: unknown) {
      const safeMessage = toSafeSyncErrorMessage(error);
      const finalAttempt = isFinalAttempt(job);

      if (finalAttempt) {
        await this.syncRunsDataService.markFailed(
          job.data.syncRunId,
          safeMessage,
          buildFailureMetadata(job.data),
        );
        this.logger.warn(`Sync job failed ${context} error="${safeMessage}"`);
      } else {
        this.logger.warn(
          `Sync job will retry ${context} error="${safeMessage}"`,
        );
      }

      throw error;
    }
  }
}

function buildFailureMetadata(jobData: SyncJobData): Record<string, unknown> {
  return jobData.appIds === undefined
    ? {
        scope: jobData.scope,
        steamId: jobData.steamId,
      }
    : {
        scope: jobData.scope,
        steamId: jobData.steamId,
        appIds: jobData.appIds,
      };
}

function isFinalAttempt(job: Job<SyncJobData>): boolean {
  const attempts = job.opts.attempts ?? 1;

  return job.attemptsMade + 1 >= attempts;
}

function buildLogContext(job: Job<SyncJobData>): string {
  return [
    `syncRunId=${job.data.syncRunId}`,
    `steamId=${job.data.steamId}`,
    `scope=${job.data.scope}`,
    `jobId=${job.id === undefined ? 'unknown' : String(job.id)}`,
    `attempt=${job.attemptsMade + 1}`,
    `maxAttempts=${job.opts.attempts ?? 1}`,
  ].join(' ');
}
