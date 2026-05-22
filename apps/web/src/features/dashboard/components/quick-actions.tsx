import {
  SyncRequestDtoScopeEnum,
  type DashboardSyncRunResponseDto,
  type QueuedSyncResponseDto,
} from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDateTime } from '@/lib/format';

const syncActions = [
  { label: 'Sync Profile', scope: SyncRequestDtoScopeEnum.Profile },
  { label: 'Sync Games', scope: SyncRequestDtoScopeEnum.Games },
  { label: 'Sync Achievements', scope: SyncRequestDtoScopeEnum.Achievements },
] as const;

export function QuickActions({
  latestSync,
  onSync,
  pendingScope,
  publicSlug,
  queuedSync,
  steamId,
}: Readonly<{
  latestSync: DashboardSyncRunResponseDto | null;
  onSync: (scope: SyncRequestDtoScopeEnum) => void;
  pendingScope: SyncRequestDtoScopeEnum | null;
  publicSlug: string | null | undefined;
  queuedSync: QueuedSyncResponseDto | null;
  steamId: string;
}>): ReactNode {
  return (
    <SectionCard
      description="Run queued refresh jobs and jump into the next private workflow without leaving the command center."
      title="Sync And Quick Actions"
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          {syncActions.map((action) => (
            <button
              className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              disabled={pendingScope === action.scope}
              key={action.scope}
              onClick={() => onSync(action.scope)}
              type="button"
            >
              {pendingScope === action.scope ? 'Queueing...' : action.label}
            </button>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {publicSlug ? (
            <Link
              className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
              href={`/u/${publicSlug}`}
            >
              View Public Profile
            </Link>
          ) : null}
          <Link
            className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
            href="/games"
          >
            Browse Games
          </Link>
          <Link
            className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
            href="/account/targets"
          >
            Manage Targets
          </Link>
          <Link
            className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
            href={`/profiles/${steamId}`}
          >
            Open Full Profile
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
          <div className="font-semibold text-white">Latest sync status</div>
          {latestSync ? (
            <div className="mt-2 space-y-2 text-slate-300">
              <div className="flex flex-wrap items-center gap-2">
                <span className="capitalize">{latestSync.syncType}</span>
                <StatusBadge
                  tone={
                    latestSync.status === 'failed'
                      ? 'danger'
                      : latestSync.status === 'partial_success'
                        ? 'warning'
                        : 'success'
                  }
                >
                  {latestSync.status}
                </StatusBadge>
              </div>
              <div className="text-xs text-slate-500">
                {formatDateTime(latestSync.finishedAt ?? latestSync.startedAt)}
              </div>
            </div>
          ) : (
            <p className="mt-1 text-slate-400">No sync runs yet for {steamId}.</p>
          )}
          {queuedSync ? (
            <p className="mt-2 text-lime-100">
              Queued {queuedSync.scope} sync run{' '}
              <span className="font-mono">{queuedSync.syncRunId}</span>.
            </p>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}
