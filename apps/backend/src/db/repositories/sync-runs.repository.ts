import { Injectable } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel, SQL } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { syncRuns } from '../schema';
import type { SyncRunMetadata } from '../schema';

export type SyncRun = InferSelectModel<typeof syncRuns>;
export type NewSyncRun = InferInsertModel<typeof syncRuns>;
export type SyncRunType = 'profile' | 'games' | 'achievements' | 'full';
export type SyncRunStatus =
  | 'queued'
  | 'running'
  | 'success'
  | 'partial_success'
  | 'failed';

export interface CreateSyncRunInput {
  profileId?: string | null;
  syncType: SyncRunType;
  status?: SyncRunStatus;
  metadata?: SyncRunMetadata;
}

interface UpdateSyncRunStatusInput {
  status?: SyncRunStatus;
  finishedAt?: Date | SQL;
  errorMessage?: string | null;
  metadata?: SyncRunMetadata;
}

@Injectable()
export class SyncRunsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createRun(input: CreateSyncRunInput): Promise<SyncRun> {
    const rows = await this.databaseService.db
      .insert(syncRuns)
      .values({
        profileId: input.profileId,
        syncType: input.syncType,
        status: input.status ?? 'queued',
        metadata: input.metadata,
      })
      .returning();

    return rows[0];
  }

  async markRunning(id: string): Promise<SyncRun | null> {
    return this.updateStatus(id, { status: 'running' });
  }

  async assignProfile(id: string, profileId: string): Promise<SyncRun | null> {
    const rows = await this.databaseService.db
      .update(syncRuns)
      .set({ profileId })
      .where(eq(syncRuns.id, id))
      .returning();

    return rows[0] ?? null;
  }

  async markSuccess(
    id: string,
    metadata?: SyncRunMetadata,
  ): Promise<SyncRun | null> {
    return this.updateStatus(id, {
      status: 'success',
      finishedAt: sql`now()`,
      errorMessage: null,
      metadata,
    });
  }

  async markPartialSuccess(
    id: string,
    errorMessage?: string,
    metadata?: SyncRunMetadata,
  ): Promise<SyncRun | null> {
    return this.updateStatus(id, {
      status: 'partial_success',
      finishedAt: sql`now()`,
      errorMessage,
      metadata,
    });
  }

  async markFailed(
    id: string,
    errorMessage: string,
    metadata?: SyncRunMetadata,
  ): Promise<SyncRun | null> {
    return this.updateStatus(id, {
      status: 'failed',
      finishedAt: sql`now()`,
      errorMessage,
      metadata,
    });
  }

  async findLatestByProfile(profileId: string, limit: number): Promise<SyncRun[]> {
    return this.databaseService.db
      .select()
      .from(syncRuns)
      .where(eq(syncRuns.profileId, profileId))
      .orderBy(desc(syncRuns.startedAt))
      .limit(limit);
  }

  async findById(id: string): Promise<SyncRun | null> {
    const rows = await this.databaseService.db
      .select()
      .from(syncRuns)
      .where(eq(syncRuns.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  private async updateStatus(
    id: string,
    input: UpdateSyncRunStatusInput,
  ): Promise<SyncRun | null> {
    const rows = await this.databaseService.db
      .update(syncRuns)
      .set(input)
      .where(eq(syncRuns.id, id))
      .returning();

    return rows[0] ?? null;
  }
}
