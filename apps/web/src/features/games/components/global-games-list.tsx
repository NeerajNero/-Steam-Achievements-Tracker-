import Link from 'next/link';
import type { ReactNode } from 'react';

import type { GlobalGameItemResponseDto } from '@steam-achievement/client-sdk';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Game</th>
                <th className="px-4 py-3">Achievements</th>
                <th className="px-4 py-3">Tracked Players</th>
                <th className="px-4 py-3">Average</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Playtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {items.map((game) => (
                <tr key={game.steamAppId}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {game.iconUrl ? (
                        <img
                          alt=""
                          className="h-10 w-10 rounded-xl border border-white/10"
                          src={game.iconUrl}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-xl border border-white/10 bg-white/5" />
                      )}
                      <div>
                        <Link
                          className="font-medium text-lime-200 hover:text-lime-100"
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
                    {formatAchievementMetadata(game)}
                  </td>
                  <td className="px-4 py-3">{formatNumber(game.trackedPlayers)}</td>
                  <td className="px-4 py-3">
                    {formatPercent(game.averageCompletionPercentage)}
                    <div className="mt-2">
                      <ProgressBar value={game.averageCompletionPercentage} />
                    </div>
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
    </SectionCard>
  );
}
