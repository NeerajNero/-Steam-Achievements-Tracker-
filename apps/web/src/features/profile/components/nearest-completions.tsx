import Link from 'next/link';
import type { ReactNode } from 'react';

import type { GameLibraryItemResponseDto } from '@steam-achievement/client-sdk';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionCard } from '@/components/ui/section-card';
import { formatNumber, formatPercent, formatPlaytime, getErrorMessage } from '@/lib/format';

export function NearestCompletions({
  error,
  isError,
  isLoading,
  items,
  steamId,
}: Readonly<{
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  items: readonly GameLibraryItemResponseDto[] | undefined;
  steamId: string;
}>): ReactNode {
  return (
    <SectionCard
      description="Games closest to full completion, excluding completed and no-achievement games."
      title="Nearest Completions"
    >
      {isLoading ? <LoadingState message="Loading nearest completions..." /> : null}
      {isError ? (
        <div className="p-4">
          <ErrorState message={getErrorMessage(error)} />
        </div>
      ) : null}

      {items && items.length > 0 ? (
        <ul className="divide-y divide-white/10">
          {items.map((game) => (
            <li className="p-4" key={game.steamAppId}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    className="font-medium text-lime-200 hover:text-lime-100"
                    href={`/profiles/${steamId}/games/${game.steamAppId}`}
                  >
                    {game.name}
                  </Link>
                  <div className="mt-1 text-sm text-slate-500">
                    App {game.steamAppId}
                  </div>
                </div>
                <span className="rounded-full border border-lime-300/30 bg-lime-400/10 px-2 py-0.5 text-xs font-semibold text-lime-100">
                  {formatPercent(game.completionPercentage)}
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar value={game.completionPercentage} />
              </div>
              <div className="mt-2 text-sm text-slate-400">
                <span>{formatNumber(game.remainingAchievements)} remaining</span>
                <span className="mx-2 text-slate-300">·</span>
                <span>{formatPlaytime(game.playtimeMinutes)}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {items && items.length === 0 ? (
        <EmptyState message="No near-completion games found." />
      ) : null}
    </SectionCard>
  );
}
