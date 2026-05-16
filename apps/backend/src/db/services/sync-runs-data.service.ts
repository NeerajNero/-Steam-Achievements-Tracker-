import { Injectable } from '@nestjs/common';

import {
  SyncRunsRepository,
  type CreateSyncRunInput,
  type SyncRun,
} from '../repositories/sync-runs.repository';
import type { SyncRunMetadata } from '../schema';

export type {
  CreateSyncRunInput,
  NewSyncRun,
  SyncRun,
  SyncRunStatus,
  SyncRunType,
} from '../repositories/sync-runs.repository';

@Injectable()
export class SyncRunsDataService {
  constructor(private readonly syncRunsRepository: SyncRunsRepository) {}

  async createRun(input: CreateSyncRunInput): Promise<SyncRun> {
    return this.syncRunsRepository.createRun(input);
  }

  async markRunning(id: string): Promise<SyncRun | null> {
    return this.syncRunsRepository.markRunning(id);
  }

  async assignProfile(id: string, profileId: string): Promise<SyncRun | null> {
    return this.syncRunsRepository.assignProfile(id, profileId);
  }

  async markSuccess(
    id: string,
    metadata?: SyncRunMetadata,
  ): Promise<SyncRun | null> {
    return this.syncRunsRepository.markSuccess(id, metadata);
  }

  async markPartialSuccess(
    id: string,
    errorMessage?: string,
    metadata?: SyncRunMetadata,
  ): Promise<SyncRun | null> {
    return this.syncRunsRepository.markPartialSuccess(
      id,
      errorMessage,
      metadata,
    );
  }

  async markFailed(
    id: string,
    errorMessage: string,
    metadata?: SyncRunMetadata,
  ): Promise<SyncRun | null> {
    return this.syncRunsRepository.markFailed(id, errorMessage, metadata);
  }

  async findLatestByProfile(
    profileId: string,
    limit: number,
  ): Promise<SyncRun[]> {
    return this.syncRunsRepository.findLatestByProfile(profileId, limit);
  }

  async findById(id: string): Promise<SyncRun | null> {
    return this.syncRunsRepository.findById(id);
  }
}
