import Link from 'next/link';
import type { ReactNode } from 'react';

import type { GlobalGameItemResponseDto } from '@steam-achievement/client-sdk';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import {
  formatNumber,
  formatPercent,
  formatPlaytime,
  getErrorMessage,
} from '@/lib/format';

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
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-xl font-semibold text-slate-950">Tracked Game Library</h2>
        <p className="mt-1 text-sm text-slate-600">
          Showing {items?.length ?? 0} of {total ?? 0} games.
        </p>
      </div>

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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Game</th>
                <th className="px-4 py-3">Achievements</th>
                <th className="px-4 py-3">Tracked Players</th>
                <th className="px-4 py-3">Average</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Playtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((game) => (
                <tr key={game.steamAppId}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {game.iconUrl ? (
                        <img
                          alt=""
                          className="h-10 w-10 rounded-md border border-slate-200"
                          src={game.iconUrl}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md border border-slate-200 bg-slate-100" />
                      )}
                      <div>
                        <Link
                          className="font-medium text-blue-700 hover:text-blue-900"
                          href={`/games/${game.steamAppId}`}
                        >
                          {game.name}
                        </Link>
                        <div className="text-xs text-slate-500">
                          App {game.steamAppId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {game.hasAchievements
                      ? formatNumber(game.totalAchievements)
                      : 'No achievements'}
                  </td>
                  <td className="px-4 py-3">{formatNumber(game.trackedPlayers)}</td>
                  <td className="px-4 py-3">
                    {formatPercent(game.averageCompletionPercentage)}
                  </td>
                  <td className="px-4 py-3">{formatNumber(game.completedPlayers)}</td>
                  <td className="px-4 py-3">
                    {formatPlaytime(game.totalPlaytimeMinutes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
