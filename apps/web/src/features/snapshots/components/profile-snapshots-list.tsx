import type { ProfileSnapshotResponseDto } from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionCard } from '@/components/ui/section-card';
import {
  formatDateTime,
  formatNumber,
  formatPercent,
  getErrorMessage,
} from '@/lib/format';

export function ProfileSnapshotsList({
  error,
  isError,
  isLoading,
  snapshots,
}: Readonly<{
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  snapshots: ProfileSnapshotResponseDto[] | undefined;
}>): ReactNode {
  if (isLoading) {
    return <LoadingState message="Loading snapshots..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message={getErrorMessage(error)}
        title="Snapshots are unavailable"
      />
    );
  }

  if (!snapshots || snapshots.length === 0) {
    return (
      <EmptyState
        message="Snapshots are created after completed syncs or manual snapshot runs."
        title="No snapshots yet"
      />
    );
  }

  return (
    <SectionCard title="Progress Snapshots">
      <div className="mt-4 grid gap-3">
        {snapshots.map((snapshot) => (
          <article
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
            key={snapshot.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium text-white">
                {formatPercent(snapshot.averageCompletionPercentage)}
              </div>
              <div className="text-xs uppercase tracking-normal text-slate-500">
                {snapshot.snapshotReason.replace('_', ' ')}
              </div>
            </div>
            <div className="mt-3">
              <ProgressBar value={snapshot.averageCompletionPercentage} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Games</dt>
                <dd className="font-medium text-slate-200">
                  {formatNumber(snapshot.completedGames)} /{' '}
                  {formatNumber(snapshot.totalGames)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Achievements</dt>
                <dd className="font-medium text-slate-200">
                  {formatNumber(snapshot.unlockedAchievements)} /{' '}
                  {formatNumber(snapshot.totalAchievements)}
                </dd>
              </div>
            </dl>
            <div className="mt-3 text-xs text-slate-500">
              {formatDateTime(snapshot.createdAt)}
            </div>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
