import Link from 'next/link';
import type { ReactNode } from 'react';

import type { GameLibraryItemResponseDto } from '@steam-achievement/client-sdk';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
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
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-lg font-semibold text-slate-950">Nearest Completions</h2>
        <p className="mt-1 text-sm text-slate-600">
          Games closest to full completion, excluding completed and no-achievement games.
        </p>
      </div>
      {isLoading ? <LoadingState message="Loading nearest completions..." /> : null}
      {isError ? (
        <div className="p-4">
          <ErrorState message={getErrorMessage(error)} />
        </div>
      ) : null}

      {items && items.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {items.map((game) => (
            <li className="p-4" key={game.steamAppId}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    className="font-medium text-blue-700 hover:text-blue-900"
                    href={`/profiles/${steamId}/games/${game.steamAppId}`}
                  >
                    {game.name}
                  </Link>
                  <div className="mt-1 text-sm text-slate-500">
                    App {game.steamAppId}
                  </div>
                </div>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {formatPercent(game.completionPercentage)}
                </span>
              </div>
              <div className="mt-2 text-sm text-slate-600">
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
    </section>
  );
}
