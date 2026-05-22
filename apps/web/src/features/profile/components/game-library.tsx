import Link from 'next/link';

import type { GameLibraryItemResponseDto } from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge';
import {
  formatNumber,
  formatDateTime,
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
  metadata_only: 'warning',
  no_achievements: 'warning',
  not_synced: 'warning',
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
      description={`Showing ${items?.length ?? 0} of ${total ?? 0} stored games with explicit achievement data states.`}
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
        <>
          <div className="grid gap-3 lg:hidden">
            {items.map((game) => {
              const status = getProfileGameStatus(game);

              return (
                <article
                  className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
                  key={`mobile-${game.steamAppId}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        className="font-semibold text-lime-200 hover:text-lime-100"
                        href={`/profiles/${steamId}/games/${game.steamAppId}`}
                      >
                        {game.name}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">App {game.steamAppId}</p>
                    </div>
                    <StatusBadge tone={statusBadgeTone[status]}>
                      {formatProfileGameStatusLabel(status)}
                    </StatusBadge>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                        Progress
                      </p>
                      {status === 'metadata_only' ? (
                        <p className="mt-1 text-sm text-slate-300">
                          Unknown unlock state
                        </p>
                      ) : status === 'not_synced' ? (
                        <p className="mt-1 text-sm text-slate-300">Metadata not synced</p>
                      ) : (
                        <>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {formatPercent(game.completionPercentage)}
                          </p>
                          <div className="mt-2">
                            <ProgressBar value={game.completionPercentage} />
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                        Playtime
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {formatPlaytime(game.playtimeMinutes)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {game.playtimeTwoWeeksMinutes > 0
                          ? `${formatPlaytime(game.playtimeTwoWeeksMinutes)} past 2 weeks`
                          : 'No recent play'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                        Last played
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {formatDateTime(game.lastPlayedAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                        Remaining
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {status === 'metadata_only' || status === 'not_synced'
                          ? 'Unknown'
                          : formatNumber(game.remainingAchievements)}
                      </p>
                    </div>
                  </div>
                  {status === 'metadata_only' ? (
                    <p className="mt-3 text-xs leading-5 text-amber-100">
                      Achievement metadata exists, but Steam did not expose player unlock state.
                    </p>
                  ) : null}
                  {status === 'not_synced' ? (
                    <p className="mt-3 text-xs leading-5 text-amber-100">
                      Achievement metadata has not been synced for this game yet.
                    </p>
                  ) : null}
                  <div className="mt-4">
                    <Link
                      className="text-sm font-medium text-slate-300 hover:text-lime-200"
                      href={`/games/${game.steamAppId}`}
                    >
                      Open global game hub
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Game</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Playtime</th>
                <th className="px-4 py-3">Recent</th>
                <th className="px-4 py-3">Last Played</th>
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
                          Open global game hub
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={statusBadgeTone[status]}>
                          {formatProfileGameStatusLabel(status)}
                        </StatusBadge>
                        {status === 'metadata_only' ? (
                          <div className="mt-2 max-w-40 text-xs text-amber-100">
                            Achievement metadata exists; unlock state is unknown.
                          </div>
                        ) : null}
                        {status === 'not_synced' ? (
                          <div className="mt-2 max-w-40 text-xs text-amber-100">
                            Achievement metadata has not been synced for this game.
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {status === 'metadata_only' ? (
                          <>
                            Unknown
                            <div className="mt-1 text-xs text-slate-500">
                              Unknown / {formatNumber(game.achievementMetadataCount)}
                            </div>
                          </>
                        ) : status === 'not_synced' ? (
                          <span className="text-slate-400">Metadata not synced</span>
                        ) : (
                          <>
                            {formatPercent(game.completionPercentage)}
                            <div className="mt-2">
                              <ProgressBar value={game.completionPercentage} />
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {game.unlockedAchievements}/{game.totalAchievements}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">{formatPlaytime(game.playtimeMinutes)}</td>
                      <td className="px-4 py-3">
                        {game.playtimeTwoWeeksMinutes > 0
                          ? formatPlaytime(game.playtimeTwoWeeksMinutes)
                          : 'No recent play'}
                      </td>
                      <td className="px-4 py-3">{formatDateTime(game.lastPlayedAt)}</td>
                      <td className="px-4 py-3">
                        {status === 'metadata_only' || status === 'not_synced'
                          ? 'Unknown'
                          : formatNumber(game.remainingAchievements)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </SectionCard>
  );
}
