import type { SyncHistoryItemResponseDto } from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
import { formatDateTime, getErrorMessage } from '@/lib/format';

import { formatSyncMetadata } from '../utils/sync-metadata';
import { SyncStatusBadge } from './sync-status-badge';

export function SyncRunsList({
  error,
  isError,
  isLoading,
  isPolling,
  runs,
}: Readonly<{
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  isPolling: boolean;
  runs: readonly SyncHistoryItemResponseDto[] | undefined;
}>): ReactNode {
  return (
    <SectionCard>
      <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
        <div>
          <h2 className="text-xl font-semibold text-white">Sync Runs</h2>
          {isPolling ? (
            <p className="mt-1 text-sm text-lime-300">Polling active run...</p>
          ) : null}
        </div>
      </div>
      {isLoading ? <LoadingState message="Loading sync runs..." /> : null}
      {isError ? (
        <div className="p-4">
          <ErrorState message={getErrorMessage(error)} />
        </div>
      ) : null}
      {runs?.length === 0 ? (
        <EmptyState message="No sync runs recorded yet." />
      ) : null}
      {runs && runs.length > 0 ? (
        <ul className="divide-y divide-white/10">
          {runs.map((run) => (
            <li className="p-4" key={run.id}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium capitalize text-slate-100">
                  {run.syncType}
                </span>
                <SyncStatusBadge status={run.status} />
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Started {formatDateTime(run.startedAt)}
                {run.finishedAt ? (
                  <span className="ml-2">
                    · Finished {formatDateTime(run.finishedAt)}
                  </span>
                ) : null}
              </div>
              {formatSyncMetadata(run.metadata) ? (
                <p className="mt-2 text-sm text-slate-300">
                  {formatSyncMetadata(run.metadata)}
                </p>
              ) : null}
              {run.errorMessage ? (
                <div className="mt-2 rounded-xl border border-red-500/30 bg-red-500/10 px-2 py-1 text-sm text-red-200">
                  {run.errorMessage}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </SectionCard>
  );
}
