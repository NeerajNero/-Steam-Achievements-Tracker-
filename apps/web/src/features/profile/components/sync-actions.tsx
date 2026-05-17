import {
  type QueuedSyncResponseDto,
  type SyncHistoryItemResponseDto,
  type SyncRequestDtoScopeEnum,
} from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { formatDateTime } from '@/lib/format';

import { getErrorMessage } from '@/lib/format';
import { SectionCard } from '@/components/ui/section-card';
import { formatSyncMetadata } from '../utils/sync-metadata';
import { SyncStatusBadge } from './sync-status-badge';

interface SyncAction {
  label: string;
  scope: SyncRequestDtoScopeEnum;
}

export function SyncActions({
  actions,
  error,
  onSync,
  pendingScope,
  queuedSync,
  latestSync,
}: Readonly<{
  actions: readonly SyncAction[];
  error: unknown;
  onSync: (scope: SyncRequestDtoScopeEnum) => void;
  pendingScope: SyncRequestDtoScopeEnum | null;
  queuedSync: QueuedSyncResponseDto | null;
  latestSync: SyncHistoryItemResponseDto | null;
}>): ReactNode {
  return (
    <div className="mt-6">
      <SectionCard
        description="Jobs are queued in the backend. Status refreshes through sync runs."
        title="Sync"
      >
      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((action) => {
          const isPending = pendingScope === action.scope;

          return (
            <button
              className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              disabled={isPending}
              key={action.scope}
              onClick={() => onSync(action.scope)}
              type="button"
            >
              {isPending ? 'Queueing...' : action.label}
            </button>
          );
        })}
      </div>

      {latestSync ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
          <div className="font-semibold text-white">Latest sync</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex font-medium text-slate-300 capitalize">
              {latestSync.syncType}
            </span>
            <SyncStatusBadge status={latestSync.status} />
            {latestSync.finishedAt ? (
              <span className="text-xs text-slate-400">
                Finished {formatDateTime(latestSync.finishedAt)}
              </span>
            ) : null}
          </div>
          {formatSyncMetadata(latestSync.metadata) ? (
            <p className="mt-1 text-slate-400">{formatSyncMetadata(latestSync.metadata)}</p>
          ) : null}
          {latestSync.errorMessage ? (
            <p className="mt-1 rounded bg-red-500/10 px-2 py-1 text-sm text-red-100">
              {latestSync.errorMessage}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
          <div className="font-semibold text-white">Latest sync</div>
          <p className="text-slate-400">No sync runs yet.</p>
        </div>
      )}

      {queuedSync ? (
        <div className="mt-4 rounded-xl border border-lime-300/20 bg-lime-400/10 px-3 py-2 text-sm text-lime-100">
          <div>
            Queued {queuedSync.scope} sync run{' '}
            <span className="font-mono">{queuedSync.syncRunId}</span>.
          </div>
          <div className="mt-1">
            Job ID: <span className="font-mono">{queuedSync.jobId}</span>
          </div>
        </div>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-100">
          {getErrorMessage(error)}
        </p>
      ) : null}
      </SectionCard>
    </div>
  );
}
