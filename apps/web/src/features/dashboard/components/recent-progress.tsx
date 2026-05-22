import type {
  DashboardActivityResponseDto,
  DashboardBadgeResponseDto,
  DashboardMilestoneResponseDto,
  DashboardSyncRunResponseDto,
} from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { EmptyState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDateTime } from '@/lib/format';

function formatActivityMetadata(metadata: object): string | null {
  const entries = Object.entries(metadata as Record<string, unknown>).filter(
    ([, value]) =>
      value !== null &&
      value !== undefined &&
      (typeof value === 'string' || typeof value === 'number'),
  );

  if (entries.length === 0) {
    return null;
  }

  return entries
    .slice(0, 2)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');
}

export function RecentProgress({
  activity,
  badges,
  milestones,
  syncRuns,
}: Readonly<{
  activity: readonly DashboardActivityResponseDto[];
  badges: readonly DashboardBadgeResponseDto[];
  milestones: readonly DashboardMilestoneResponseDto[];
  syncRuns: readonly DashboardSyncRunResponseDto[];
}>): ReactNode {
  const hasProgress =
    activity.length > 0 ||
    milestones.length > 0 ||
    badges.length > 0 ||
    syncRuns.length > 0;

  return (
    <SectionCard
      description="The latest visible movement across sync runs, activity, milestones, and earned badges."
      title="Recent Progress"
    >
      {!hasProgress ? (
        <EmptyState
          message="No recent progress yet. Sync your profile and achievements to populate this feed."
          title="No progress events"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Latest activity
            </h3>
            {activity.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                No activity events yet.
              </p>
            ) : (
              activity.map((item) => (
                <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4" key={item.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone="info">{item.eventType}</StatusBadge>
                    <span className="text-xs text-slate-500">
                      {formatDateTime(item.occurredAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-200">{item.entityType}</p>
                  {formatActivityMetadata(item.metadata) ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {formatActivityMetadata(item.metadata)}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </div>

          <div className="space-y-4">
            <ProgressList
              emptyMessage="No recent sync runs."
              items={syncRuns.map((run) => ({
                id: run.id,
                label: `${run.syncType} sync`,
                meta: run.status,
                time: run.finishedAt ?? run.startedAt,
              }))}
              title="Sync runs"
            />
            <ProgressList
              emptyMessage="No milestones earned yet."
              items={milestones.map((milestone) => ({
                id: milestone.id,
                label: milestone.title,
                meta: milestone.description ?? milestone.milestoneType,
                time: milestone.achievedAt,
              }))}
              title="Milestones"
            />
            <ProgressList
              emptyMessage="No badges earned yet."
              items={badges.map((badge) => ({
                id: badge.id,
                label: badge.name,
                meta: badge.tier ?? badge.code,
                time: badge.earnedAt,
              }))}
              title="Badges"
            />
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function ProgressList({
  emptyMessage,
  items,
  title,
}: Readonly<{
  emptyMessage: string;
  items: readonly {
    id: string;
    label: string;
    meta: string;
    time: string;
  }[];
  title: string;
}>): ReactNode {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          {items.map((item) => (
            <article
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              key={item.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-white">{item.label}</p>
                <span className="text-xs text-slate-500">
                  {formatDateTime(item.time)}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{item.meta}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
