import {
  type QueuedSyncResponseDto,
  type SyncRequestDtoScopeEnum,
} from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { getErrorMessage } from '@/lib/format';

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
}: Readonly<{
  actions: readonly SyncAction[];
  error: unknown;
  onSync: (scope: SyncRequestDtoScopeEnum) => void;
  pendingScope: SyncRequestDtoScopeEnum | null;
  queuedSync: QueuedSyncResponseDto | null;
}>): ReactNode {
  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Sync</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Jobs are queued in the backend. Status refreshes through sync runs
            below.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
      </div>

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
