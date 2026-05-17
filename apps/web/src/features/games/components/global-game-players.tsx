import {
  ListGlobalGamePlayersOrderEnum,
  ListGlobalGamePlayersSortEnum,
  ListGlobalGamePlayersStatusEnum,
  type GlobalGamePlayerResponseDto,
} from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
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
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-xl font-semibold text-slate-950">Tracked Players</h2>
        <p className="mt-1 text-sm text-slate-600">
          Public Steam profile progress for players tracked by this database.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <label className="grid gap-1">
            <span className="text-xs font-medium text-slate-600">Status</span>
            <select
              aria-label="Tracked player status"
              className="h-10 rounded-md border border-slate-300 px-2"
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
            <span className="text-xs font-medium text-slate-600">Sort</span>
            <select
              aria-label="Tracked player sort"
              className="h-10 rounded-md border border-slate-300 px-2"
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
            <span className="text-xs font-medium text-slate-600">Order</span>
            <select
              aria-label="Tracked player sort order"
              className="h-10 rounded-md border border-slate-300 px-2"
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
            <span className="text-xs font-medium text-slate-600">Limit</span>
            <select
              aria-label="Tracked players per page"
              className="h-10 rounded-md border border-slate-300 px-2"
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
            <span className="text-xs font-medium text-slate-600">Page</span>
            <div className="flex gap-2">
              <button
                className="h-10 rounded-md border border-slate-300 px-3 text-sm font-medium disabled:cursor-not-allowed disabled:text-slate-300"
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
                className="h-10 rounded-md border border-slate-300 px-3 text-sm font-medium disabled:cursor-not-allowed disabled:text-slate-300"
                disabled={!canGoNext}
                onClick={() => onFiltersChange({ offset: filters.offset + filters.limit })}
                type="button"
              >
                Next
              </button>
            </div>
          </label>
        </div>
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
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Playtime</th>
                <th className="px-4 py-3">Last Played</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((player) => (
                <tr key={player.steamId}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {player.avatarUrl ? (
                        <img
                          alt=""
                          className="h-10 w-10 rounded-full border border-slate-200"
                          src={player.avatarUrl}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full border border-slate-200 bg-slate-100" />
                      )}
                      <div>
                        <Link
                          className="font-medium text-blue-700 hover:text-blue-900"
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
                    <div className="text-xs text-slate-500">
                      {formatNumber(player.unlockedAchievements)}/
                      {formatNumber(player.totalAchievements)}
                    </div>
                  </td>
                  <td className="px-4 py-3">{formatPlaytime(player.playtimeMinutes)}</td>
                  <td className="px-4 py-3">{formatDateTime(player.lastPlayedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
