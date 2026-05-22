import Link from 'next/link';
import type { ReactNode } from 'react';

import type { MyDashboardResponseDto } from '@steam-achievement/client-sdk';
import { PageHero } from '@/components/layout/page-hero';
import { StatusBadge } from '@/components/ui/status-badge';
import { SummaryCard } from '@/components/ui/summary-card';
import { formatDateTime, formatNumber, formatPercent } from '@/lib/format';

export function DashboardHero({
  dashboard,
}: Readonly<{
  dashboard: MyDashboardResponseDto;
}>): ReactNode {
  const profile = dashboard.profile;

  return (
    <div className="space-y-5">
      <PageHero
        actions={
          <>
            <Link
              className="rounded-full bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300"
              href="/account/targets"
            >
              Manage Targets
            </Link>
            {profile?.publicSlug && profile.publicProfileIsPublished ? (
              <Link
                className="rounded-full border border-lime-300/40 px-4 py-2 text-sm font-semibold text-lime-100 hover:bg-lime-300/10"
                href={`/u/${profile.publicSlug}`}
              >
                View Public Profile
              </Link>
            ) : null}
          </>
        }
        eyebrow="Hunter command center"
        title={`Welcome${profile?.personaName ? `, ${profile.personaName}` : ''}`}
      >
        <div className="flex flex-wrap items-center gap-4">
          {profile?.avatarUrl ? (
            <img
              alt=""
              className="h-14 w-14 rounded-2xl border border-lime-300/30"
              src={profile.avatarUrl}
            />
          ) : null}
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="accent">Steam hunter profile</StatusBadge>
              <StatusBadge
                tone={
                  dashboard.dataQuality.metadataOnlyGames + dashboard.dataQuality.notSyncedGames >
                  0
                    ? 'warning'
                    : 'success'
                }
              >
                {dashboard.dataQuality.metadataOnlyGames + dashboard.dataQuality.notSyncedGames >
                0
                  ? 'Sync attention needed'
                  : 'Sync state clean'}
              </StatusBadge>
            </div>
            <p>
              Steam ID:{' '}
              <span className="font-mono text-lime-200">
                {profile?.steamId ?? 'No linked Steam profile'}
              </span>
            </p>
            <p className="text-slate-400">
              Latest stored sync: {formatDateTime(profile?.lastSyncedAt)}
            </p>
            <p className="text-slate-400">
              Focus first on saved active targets, then deterministic next targets, then the
              sync-attention queue.
            </p>
          </div>
        </div>
      </PageHero>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          hint={`${formatNumber(dashboard.summary.completedGames)} completed`}
          label="Tracked games"
          value={formatNumber(dashboard.summary.totalGames)}
        />
        <SummaryCard
          hint={`${formatNumber(dashboard.summary.remainingAchievements)} remaining`}
          label="Unlocked achievements"
          value={`${formatNumber(dashboard.summary.unlockedAchievements)} / ${formatNumber(dashboard.summary.totalAchievements)}`}
        />
        <SummaryCard
          hint="Across stored Steam games"
          label="Average completion"
          value={formatPercent(dashboard.summary.averageCompletionPercentage)}
        />
        <SummaryCard
          hint={`${formatNumber(dashboard.activeTargets.games.length + dashboard.activeTargets.achievements.length)} saved / ${formatNumber(dashboard.nextTargets.length)} suggestions`}
          label="Targets in focus"
          value={formatNumber(
            dashboard.activeTargets.games.length + dashboard.activeTargets.achievements.length,
          )}
        />
      </div>
    </div>
  );
}
