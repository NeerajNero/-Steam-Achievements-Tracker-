import {
  type QueuedSyncResponseDto,
  QueuedSyncResponseDtoScopeEnum,
  QueuedSyncResponseDtoStatusEnum,
  type SyncHistoryItemResponseDto,
  SyncHistoryItemResponseDtoStatusEnum,
  SyncHistoryItemResponseDtoSyncTypeEnum,
} from '@steam-achievement/client-sdk';
import { describe, expect, it } from 'vitest';

import {
  findRelevantSyncRun,
  isActiveSyncStatus,
  isTerminalSyncStatus,
  shouldPollSyncRuns,
} from './sync-status';

describe('sync status helpers', () => {
  it('detects active and terminal statuses', () => {
    expect(isActiveSyncStatus(SyncHistoryItemResponseDtoStatusEnum.Queued)).toBe(
      true,
    );
    expect(isActiveSyncStatus(SyncHistoryItemResponseDtoStatusEnum.Running)).toBe(
      true,
    );
    expect(
      isTerminalSyncStatus(SyncHistoryItemResponseDtoStatusEnum.Success),
    ).toBe(true);
    expect(
      isTerminalSyncStatus(SyncHistoryItemResponseDtoStatusEnum.PartialSuccess),
    ).toBe(true);
    expect(isTerminalSyncStatus(SyncHistoryItemResponseDtoStatusEnum.Failed)).toBe(
      true,
    );
  });

  it('polls only while the queued relevant run is active', () => {
    const queuedSync = createQueuedSync('run-1');
    const activeRun = createRun('run-1', SyncHistoryItemResponseDtoStatusEnum.Running);
    const doneRun = createRun('run-1', SyncHistoryItemResponseDtoStatusEnum.Success);

    expect(shouldPollSyncRuns([activeRun], queuedSync)).toBe(true);
    expect(shouldPollSyncRuns([doneRun], queuedSync)).toBe(false);
  });

  it('finds the queued sync run instead of blindly using the newest run', () => {
    const queuedSync = createQueuedSync('target');
    const newest = createRun('newer', SyncHistoryItemResponseDtoStatusEnum.Success);
    const target = createRun('target', SyncHistoryItemResponseDtoStatusEnum.Queued);

    expect(findRelevantSyncRun([newest, target], queuedSync)).toEqual(target);
  });
});

function createQueuedSync(syncRunId: string): QueuedSyncResponseDto {
  return {
    syncRunId,
    jobId: 'job-1',
    steamId: '765',
    scope: QueuedSyncResponseDtoScopeEnum.Profile,
    status: QueuedSyncResponseDtoStatusEnum.Queued,
    queuedAt: '2026-05-16T00:00:00.000Z',
  };
}

function createRun(
  id: string,
  status: SyncHistoryItemResponseDtoStatusEnum,
): SyncHistoryItemResponseDto {
  return {
    id,
    syncType: SyncHistoryItemResponseDtoSyncTypeEnum.Profile,
    status,
    startedAt: '2026-05-16T00:00:00.000Z',
    metadata: {},
    createdAt: '2026-05-16T00:00:00.000Z',
  };
}
