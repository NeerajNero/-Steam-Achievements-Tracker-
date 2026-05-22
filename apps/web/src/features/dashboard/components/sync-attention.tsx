import type { DashboardDataQualityResponseDto } from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { EmptyState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDateTime, formatNumber, formatPercent } from '@/lib/format';

import { getDataQualityLabel } from '../utils/dashboard-labels';

export function SyncAttention({
  dataQuality,
  steamId,
}: Readonly<{
  dataQuality: DashboardDataQualityResponseDto;
  steamId: string;
}>): ReactNode {
  const hasAttention =
    dataQuality.metadataOnlyGames > 0 || dataQuality.notSyncedGames > 0;

  return (
    <SectionCard
      description="Steam can expose achievement metadata without player unlock state. These games need another sync pass or a clearer data-state explanation."
      title="Sync Attention"
    >
      {!hasAttention ? (
        <EmptyState
          message="No metadata-only or not-synced games are currently flagged."
          title="Sync data looks clean"
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <AttentionCounter
              count={dataQuality.metadataOnlyGames}
              label="Metadata-only games"
              message={getDataQualityLabel('metadata_only')}
            />
            <AttentionCounter
              count={dataQuality.notSyncedGames}
              label="Not-synced games"
              message={getDataQualityLabel('not_synced')}
            />
          </div>
          {dataQuality.lastSyncAt ? (
            <p className="text-sm text-slate-400">
              Last sync observed {formatDateTime(dataQuality.lastSyncAt)}.
            </p>
          ) : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <GameList
              games={dataQuality.metadataOnlyExamples}
              label="Metadata-only examples"
              steamId={steamId}
              tone="warning"
            />
            <GameList
              games={dataQuality.notSyncedExamples}
              label="Not-synced examples"
              steamId={steamId}
              tone="info"
            />
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function AttentionCounter({
  count,
  label,
  message,
}: Readonly<{
  count: number;
  label: string;
  message: string;
}>): ReactNode {
  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-sm font-medium text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">
        {formatNumber(count)}
      </div>
      <p className="mt-1 text-sm text-slate-400">{message}</p>
    </article>
  );
}

function GameList({
  games,
  label,
  steamId,
  tone,
}: Readonly<{
  games: DashboardDataQualityResponseDto['metadataOnlyExamples'];
  label: string;
  steamId: string;
  tone: 'info' | 'warning';
}>): ReactNode {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </h3>
      {games.length === 0 ? (
        <p className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
          No examples in this bucket.
        </p>
      ) : (
        <div className="mt-2 space-y-3">
          {games.map((game) => (
            <Link
              className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-lime-300/40 hover:bg-lime-300/5"
              href={`/profiles/${steamId}/games/${game.steamAppId}`}
              key={`${steamId}-${game.steamAppId}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{game.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatNumber(game.unlockedAchievements)} /{' '}
                    {formatNumber(game.totalAchievements)} unlocked
                  </p>
                </div>
                <StatusBadge tone={tone}>{game.achievementDataState}</StatusBadge>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {formatPercent(game.completionPercentage)} complete
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
