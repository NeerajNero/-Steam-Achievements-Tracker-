import type { GameLibraryItemResponseDto } from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import {
  formatNumber,
  formatPercent,
  formatPlaytime,
  getErrorMessage,
} from '@/lib/format';

export function GamesTable({
  error,
  isError,
  isLoading,
  items,
  onSyncGames,
  steamId,
  total,
}: Readonly<{
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  items: readonly GameLibraryItemResponseDto[] | undefined;
  onSyncGames: () => void;
  steamId: string;
  total: number | undefined;
}>): ReactNode {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-xl font-semibold text-slate-950">Games</h2>
        <p className="mt-1 text-sm text-slate-600">
          Showing the first {items?.length ?? 0} of {total ?? 0} stored games.
        </p>
      </div>
      {isLoading ? <LoadingState message="Loading games..." /> : null}
      {isError ? (
        <div className="p-4">
          <ErrorState message={getErrorMessage(error)} />
        </div>
      ) : null}
      {items && items.length === 0 ? (
        <EmptyState
          action={
            <button
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              onClick={onSyncGames}
              type="button"
            >
              Sync Games
            </button>
          }
          message="No games synced yet. Queue a games sync to populate the dashboard."
          title="No games synced yet"
        />
      ) : null}
      {items && items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Game</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Playtime</th>
                <th className="px-4 py-3">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((game) => (
                <tr key={game.steamAppId}>
                  <td className="px-4 py-3">
                    <Link
                      className="font-medium text-blue-700 hover:text-blue-900"
                      href={`/profiles/${steamId}/games/${game.steamAppId}`}
                    >
                      {game.name}
                    </Link>
                    <div className="text-xs text-slate-500">
                      App {game.steamAppId}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {formatPercent(game.completionPercentage)}
                    <div className="text-xs text-slate-500">
                      {game.unlockedAchievements}/{game.totalAchievements}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {formatPlaytime(game.playtimeMinutes)}
                  </td>
                  <td className="px-4 py-3">
                    {formatNumber(game.remainingAchievements)}
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
