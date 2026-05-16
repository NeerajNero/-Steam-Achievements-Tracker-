import {
  type QueuedSyncResponseDto,
  type SyncHistoryItemResponseDto,
  SyncHistoryItemResponseDtoStatusEnum,
} from '@steam-achievement/client-sdk';

export function isActiveSyncStatus(status: string): boolean {
  return (
    status === SyncHistoryItemResponseDtoStatusEnum.Queued ||
    status === SyncHistoryItemResponseDtoStatusEnum.Running
  );
}

export function isTerminalSyncStatus(status: string): boolean {
  return (
    status === SyncHistoryItemResponseDtoStatusEnum.Success ||
    status === SyncHistoryItemResponseDtoStatusEnum.PartialSuccess ||
    status === SyncHistoryItemResponseDtoStatusEnum.Failed
  );
}

export function findRelevantSyncRun(
  runs: readonly SyncHistoryItemResponseDto[],
  queuedSync: QueuedSyncResponseDto | null,
): SyncHistoryItemResponseDto | undefined {
  if (queuedSync === null) {
    return runs[0];
  }

  return runs.find((run) => run.id === queuedSync.syncRunId);
}

export function shouldPollSyncRuns(
  runs: readonly SyncHistoryItemResponseDto[],
  queuedSync: QueuedSyncResponseDto | null,
): boolean {
  const relevantRun = findRelevantSyncRun(runs, queuedSync);

  if (relevantRun === undefined) {
    return queuedSync !== null;
  }

  return isActiveSyncStatus(relevantRun.status);
}

export function getSyncStatusLabel(status: string): string {
  return status.replaceAll('_', ' ');
}

export function getSyncStatusBadgeClassName(status: string): string {
  const base =
    'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize tracking-normal';

  if (status === SyncHistoryItemResponseDtoStatusEnum.Success) {
    return `${base} bg-emerald-50 text-emerald-700`;
  }

  if (
    status === SyncHistoryItemResponseDtoStatusEnum.PartialSuccess ||
    status === SyncHistoryItemResponseDtoStatusEnum.Running
  ) {
    return `${base} bg-amber-50 text-amber-700`;
  }

  if (status === SyncHistoryItemResponseDtoStatusEnum.Failed) {
    return `${base} bg-red-50 text-red-700`;
  }

  return `${base} bg-slate-100 text-slate-700`;
}
