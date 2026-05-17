import {
  ListGlobalGamePlayersOrderEnum,
  ListGlobalGamePlayersSortEnum,
  ListGlobalGamePlayersStatusEnum,
  type GlobalGamePlayerResponseDto,
} from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionCard } from '@/components/ui/section-card';
import {
  formatDateTime,
  formatNumber,
  formatPercent,
  formatPlaytime,
  getErrorMessage,
} from '@/lib/format';

import {
  getGlobalGamePlayerHref,
  GLOBAL_GAME_PLAYER_LIMIT_OPTIONS,
  type GlobalGamePlayerFilters,
} from '../utils/global-game-filters';

export function GlobalGamePlayers({
  error,
  filters,
  isError,
  isLoading,
  items,
  onFiltersChange,
  total,
}: Readonly<{
  error: unknown;
  filters: GlobalGamePlayerFilters;
  isError: boolean;
  isLoading: boolean;
  items: readonly GlobalGamePlayerResponseDto[] | undefined;
  onFiltersChange: (filters: Partial<GlobalGamePlayerFilters>) => void;
  total: number | undefined;
}>): ReactNode {
  const totalItems = total ?? 0;
  const canGoPrev = filters.offset > 0;
  const canGoNext = filters.offset + filters.limit < totalItems;

  return (
    <SectionCard
      description="Public Steam profile progress for players tracked by this database."
      title="Tracked Players"
    >
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <label className="grid gap-1">
            <span className="text-xs font-medium text-slate-400">Status</span>
            <select
              aria-label="Tracked player status"
              className="h-10 rounded-xl border border-white/10 bg-slate-900 px-2 text-white"
              onChange={(event) =>
                onFiltersChange({
                  status: event.target.value as ListGlobalGamePlayersStatusEnum,
                  offset: 0,
                })
              }
              value={filters.status}
            >
              {Object.values(ListGlobalGamePlayersStatusEnum).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-slate-400">Sort</span>
            <select
              aria-label="Tracked player sort"
              className="h-10 rounded-xl border border-white/10 bg-slate-900 px-2 text-white"
              onChange={(event) =>
                onFiltersChange({
                  sort: event.target.value as ListGlobalGamePlayersSortEnum,
                  offset: 0,
                })
              }
              value={filters.sort}
            >
              {Object.values(ListGlobalGamePlayersSortEnum).map((sort) => (
                <option key={sort} value={sort}>
                  {sort.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-slate-400">Order</span>
            <select
              aria-label="Tracked player sort order"
              className="h-10 rounded-xl border border-white/10 bg-slate-900 px-2 text-white"
              onChange={(event) =>
                onFiltersChange({
                  order: event.target.value as ListGlobalGamePlayersOrderEnum,
                })
              }
              value={filters.order}
            >
              <option value={ListGlobalGamePlayersOrderEnum.Asc}>Ascending</option>
              <option value={ListGlobalGamePlayersOrderEnum.Desc}>Descending</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-slate-400">Limit</span>
            <select
              aria-label="Tracked players per page"
              className="h-10 rounded-xl border border-white/10 bg-slate-900 px-2 text-white"
              onChange={(event) =>
                onFiltersChange({
                  limit: Number.parseInt(event.target.value, 10),
                  offset: 0,
                })
              }
              value={filters.limit}
            >
              {GLOBAL_GAME_PLAYER_LIMIT_OPTIONS.map((limit) => (
                <option key={limit} value={limit}>
                  {limit}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-slate-400">Page</span>
            <div className="flex gap-2">
              <button
                className="h-10 rounded-xl border border-white/10 px-3 text-sm font-medium text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-600"
                disabled={!canGoPrev}
                onClick={() =>
                  onFiltersChange({
                    offset: Math.max(0, filters.offset - filters.limit),
                  })
                }
                type="button"
              >
                Prev
              </button>
              <button
                className="h-10 rounded-xl border border-white/10 px-3 text-sm font-medium text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-600"
                disabled={!canGoNext}
                onClick={() => onFiltersChange({ offset: filters.offset + filters.limit })}
                type="button"
              >
                Next
              </button>
            </div>
          </label>
        </div>

      {isLoading ? <LoadingState message="Loading tracked players..." /> : null}
      {isError ? (
        <div className="p-4">
          <ErrorState message={getErrorMessage(error)} />
        </div>
      ) : null}
      {items && items.length === 0 ? (
        <EmptyState message="No tracked players match the current filters." />
      ) : null}

      {items && items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Playtime</th>
                <th className="px-4 py-3">Last Played</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {items.map((player) => (
                <tr key={player.steamId}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {player.avatarUrl ? (
                        <img
                          alt=""
                          className="h-10 w-10 rounded-full border border-white/10"
                          src={player.avatarUrl}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full border border-white/10 bg-white/5" />
                      )}
                      <div>
                        <Link
                          className="font-medium text-lime-200 hover:text-lime-100"
                          href={getGlobalGamePlayerHref(player)}
                        >
                          {player.personaName ?? player.steamId}
                        </Link>
                        <div className="text-xs text-slate-500">
                          {player.publicSlug ? `/u/${player.publicSlug}` : player.steamId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {formatPercent(player.completionPercentage)}
                    <div className="mt-2">
                      <ProgressBar value={player.completionPercentage} />
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatNumber(player.unlockedAchievements)}/
                      {formatNumber(player.totalAchievements)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {formatPlaytime(player.playtimeMinutes)}
                    <div className="mt-1 text-xs text-slate-500">
                      {player.playtimeTwoWeeksMinutes > 0
                        ? `${formatPlaytime(player.playtimeTwoWeeksMinutes)} past 2 weeks`
                        : 'No recent play'}
                    </div>
                  </td>
                  <td className="px-4 py-3">{formatDateTime(player.lastPlayedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </SectionCard>
  );
}
