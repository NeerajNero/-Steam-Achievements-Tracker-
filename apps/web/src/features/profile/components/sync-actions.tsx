import {
  type QueuedSyncResponseDto,
  type SyncHistoryItemResponseDto,
  type SyncRequestDtoScopeEnum,
} from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { formatDateTime } from '@/lib/format';

import { getErrorMessage } from '@/lib/format';
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
    <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-semibold text-slate-950">Sync</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Jobs are queued in the backend. Status refreshes through sync runs.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((action) => {
          const isPending = pendingScope === action.scope;

          return (
            <button
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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
        <div className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-800">
          <div className="font-semibold text-slate-900">Latest sync</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex font-medium text-slate-600 capitalize">
              {latestSync.syncType}
            </span>
            <SyncStatusBadge status={latestSync.status} />
            {latestSync.finishedAt ? (
              <span className="text-xs text-slate-500">
                Finished {formatDateTime(latestSync.finishedAt)}
              </span>
            ) : null}
          </div>
          {formatSyncMetadata(latestSync.metadata) ? (
            <p className="mt-1 text-slate-600">{formatSyncMetadata(latestSync.metadata)}</p>
          ) : null}
          {latestSync.errorMessage ? (
            <p className="mt-1 rounded bg-red-50 px-2 py-1 text-sm text-red-700">
              {latestSync.errorMessage}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-800">
          <div className="font-semibold text-slate-900">Latest sync</div>
          <p className="text-slate-600">No sync runs yet.</p>
        </div>
      )}

      {queuedSync ? (
        <div className="mt-4 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-900">
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
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {getErrorMessage(error)}
        </p>
      ) : null}
    </section>
  );
}
