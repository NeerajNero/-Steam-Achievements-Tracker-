import Link from 'next/link';
import type { ReactNode } from 'react';

import type { MyDashboardResponseDto } from '@steam-achievement/client-sdk';
import { PageHero } from '@/components/layout/page-hero';
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
          profile?.publicSlug && profile.publicProfileIsPublished ? (
            <Link
              className="rounded-full border border-lime-300/40 px-4 py-2 text-sm font-semibold text-lime-100 hover:bg-lime-300/10"
              href={`/u/${profile.publicSlug}`}
            >
              View Public Profile
            </Link>
          ) : null
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
            <p>
              Steam ID:{' '}
              <span className="font-mono text-lime-200">
                {profile?.steamId ?? 'No linked Steam profile'}
              </span>
            </p>
            <p className="text-slate-400">
              Latest profile sync: {formatDateTime(profile?.lastSyncedAt)}
            </p>
          </div>
        </div>
      </PageHero>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Games"
          value={formatNumber(dashboard.summary.totalGames)}
          hint={`${formatNumber(dashboard.summary.completedGames)} completed`}
        />
        <SummaryCard
          label="Achievements"
          value={`${formatNumber(dashboard.summary.unlockedAchievements)} / ${formatNumber(dashboard.summary.totalAchievements)}`}
          hint={`${formatNumber(dashboard.summary.remainingAchievements)} remaining`}
        />
        <SummaryCard
          label="Average Completion"
          value={formatPercent(dashboard.summary.averageCompletionPercentage)}
          hint="Across stored Steam games"
        />
        <SummaryCard
          label="Sync Attention"
          value={formatNumber(
            dashboard.dataQuality.metadataOnlyGames +
              dashboard.dataQuality.notSyncedGames,
          )}
          hint="Metadata-only or not synced"
        />
      </div>
    </div>
  );
}
