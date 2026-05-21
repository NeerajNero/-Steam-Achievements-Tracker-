import Link from 'next/link';
import type { ReactNode } from 'react';

import type { GlobalGameItemResponseDto } from '@steam-achievement/client-sdk';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { MetadataStateBadge } from '@/components/ui/metadata-state-badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionCard } from '@/components/ui/section-card';
import {
  formatNumber,
  formatPercent,
  formatPlaytime,
  getErrorMessage,
} from '@/lib/format';

function formatAchievementMetadata(game: GlobalGameItemResponseDto): string {
  if (game.achievementDataState === 'not_synced') {
    return 'Metadata not synced';
  }

  if (game.achievementDataState === 'no_achievements') {
    return 'No achievements confirmed';
  }

  return `${formatNumber(game.achievementMetadataCount)} achievements`;
}

export function GlobalGamesList({
  error,
  isError,
  isLoading,
  items,
  total,
}: Readonly<{
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  items: readonly GlobalGameItemResponseDto[] | undefined;
  total: number | undefined;
}>): ReactNode {
  return (
    <SectionCard
      description={`Showing ${items?.length ?? 0} of ${total ?? 0} games.`}
      title="Tracked Game Library"
    >

      {isLoading ? <LoadingState message="Loading tracked games..." /> : null}
      {isError ? (
        <div className="p-4">
          <ErrorState message={getErrorMessage(error)} />
        </div>
      ) : null}
      {items && items.length === 0 ? (
        <EmptyState
          message="No tracked games match the current filters."
          title="No games found"
        />
      ) : null}

      {items && items.length > 0 ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {items.map((game) => (
            <article
              className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
              key={game.steamAppId}
            >
              <div className="flex items-start gap-3">
                {game.iconUrl ? (
                  <img
                    alt=""
                    className="h-12 w-12 rounded-xl border border-white/10"
                    src={game.iconUrl}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl border border-white/10 bg-white/5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <MetadataStateBadge state={game.achievementDataState} />
                    <span className="text-xs text-slate-500">
                      {formatAchievementMetadata(game)}
                    </span>
                  </div>
                  <Link
                    className="mt-2 block text-lg font-semibold text-white hover:text-lime-100"
                    href={`/games/${game.steamAppId}`}
                  >
                    {game.name}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">App {game.steamAppId}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    Tracked Players
                  </p>
                  <p className="mt-1 font-semibold text-white">
                    {formatNumber(game.trackedPlayers)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    Completed Players
                  </p>
                  <p className="mt-1 font-semibold text-white">
                    {formatNumber(game.completedPlayers)}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                      Average Completion
                    </p>
                    <span className="font-semibold text-lime-100">
                      {formatPercent(game.averageCompletionPercentage)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={game.averageCompletionPercentage} />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    Total Playtime
                  </p>
                  <p className="mt-1 font-semibold text-white">
                    {formatPlaytime(game.totalPlaytimeMinutes)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}
