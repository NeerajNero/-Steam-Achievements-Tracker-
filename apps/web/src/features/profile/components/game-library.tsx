import Link from 'next/link';

import type { GameLibraryItemResponseDto } from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge';
import {
  formatNumber,
  formatPercent,
  formatPlaytime,
  getErrorMessage,
} from '@/lib/format';

import {
  formatProfileGameStatusLabel,
  getProfileGameStatus,
} from '../utils/game-status';

type GameStatus = ReturnType<typeof getProfileGameStatus>;

const statusBadgeTone: Record<GameStatus, StatusTone> = {
  completed: 'success',
  incomplete: 'default',
  no_achievements: 'warning',
};

export function GameLibrary({
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
    <SectionCard
      description={`Showing ${items?.length ?? 0} of ${total ?? 0} stored games.`}
      title="Game Library"
    >
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
              className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300"
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
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Game</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Playtime</th>
                <th className="px-4 py-3">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {items.map((game) => {
                const status = getProfileGameStatus(game);

                return (
                  <tr key={game.steamAppId}>
                    <td className="px-4 py-3">
                      <Link
                        className="font-medium text-lime-200 hover:text-lime-100"
                        href={`/profiles/${steamId}/games/${game.steamAppId}`}
                      >
                        {game.name}
                      </Link>
                      <div className="text-xs text-slate-500">
                        App {game.steamAppId}
                      </div>
                      <Link
                        className="mt-1 inline-flex text-xs font-medium text-slate-400 hover:text-lime-200"
                        href={`/games/${game.steamAppId}`}
                      >
                        Global game page
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={statusBadgeTone[status]}>
                        {formatProfileGameStatusLabel(status)}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      {formatPercent(game.completionPercentage)}
                      <div className="mt-2">
                        <ProgressBar value={game.completionPercentage} />
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {game.unlockedAchievements}/{game.totalAchievements}
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatPlaytime(game.playtimeMinutes)}</td>
                    <td className="px-4 py-3">{formatNumber(game.remainingAchievements)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </SectionCard>
  );
}
