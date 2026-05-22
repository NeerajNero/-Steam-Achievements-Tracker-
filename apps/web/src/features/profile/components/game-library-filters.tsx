import {
  ListProfileGamesOrderEnum,
  ListProfileGamesSortEnum,
  ListProfileGamesStatusEnum,
} from '@steam-achievement/client-sdk';

import { EmptyState } from '@/components/ui/panel-state';
import { DataToolbar } from '@/components/ui/data-toolbar';

import type { ProfileLibraryFilters } from '../utils/profile-library-filters';

export const PROFILE_STATUS_OPTIONS: readonly ListProfileGamesStatusEnum[] = [
  ListProfileGamesStatusEnum.All,
  ListProfileGamesStatusEnum.Completed,
  ListProfileGamesStatusEnum.Incomplete,
  ListProfileGamesStatusEnum.NoAchievements,
];

export const PROFILE_SORT_OPTIONS: readonly ListProfileGamesSortEnum[] = [
  ListProfileGamesSortEnum.Completion,
  ListProfileGamesSortEnum.Name,
  ListProfileGamesSortEnum.Playtime,
  ListProfileGamesSortEnum.RecentlyPlayed,
  ListProfileGamesSortEnum.Remaining,
];

export const PROFILE_LIMIT_OPTIONS = [10, 25, 50, 100] as const;

export function GameLibraryFilters({
  filters,
  onSubmitSearch,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onOrderChange,
  onLimitChange,
  onPageChange,
  totalGames,
  searchInput,
}: Readonly<{
  filters: ProfileLibraryFilters;
  onSubmitSearch: (search: string) => void;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: ListProfileGamesStatusEnum) => void;
  onSortChange: (sort: ListProfileGamesSortEnum) => void;
  onOrderChange: (order: ListProfileGamesOrderEnum) => void;
  onLimitChange: (limit: number) => void;
  onPageChange: (offset: number) => void;
  totalGames: number;
  searchInput: string;
}>): React.ReactNode {
  const maxOffset = Math.max(0, totalGames - 1);
  const canGoPrev = filters.offset > 0;
  const canGoNext = filters.offset + filters.limit <= maxOffset;

  return (
    <DataToolbar
      description="Search and sort the stored Steam library, then drill into game-level achievement progress."
      results={totalGames === 0 ? '0 games' : `${filters.offset + 1}-${Math.min(filters.offset + filters.limit, totalGames)} of ${totalGames}`}
      title="Library Filters"
    >
      <form
        className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr_0.6fr_0.6fr]"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmitSearch(searchInput);
        }}
      >
        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-400">Search</span>
          <div className="flex gap-2">
            <input
              aria-label="Search games"
              className="h-10 flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-300 focus:ring-2 focus:ring-lime-300/20"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by game name"
              type="text"
              value={searchInput}
            />
            <button
              className="rounded-xl bg-lime-400 px-3 text-sm font-semibold text-slate-950 hover:bg-lime-300"
              type="submit"
            >
              Apply
            </button>
          </div>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-400">Status</span>
          <select
            aria-label="Game status"
            className="h-10 rounded-xl border border-white/10 bg-slate-900 px-2 text-white"
            onChange={(event) =>
              onStatusChange(event.target.value as ListProfileGamesStatusEnum)
            }
            value={filters.status}
          >
            {PROFILE_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-400">Sort</span>
          <select
            aria-label="Sort games by"
            className="h-10 rounded-xl border border-white/10 bg-slate-900 px-2 text-white"
            onChange={(event) =>
              onSortChange(event.target.value as ListProfileGamesSortEnum)
            }
            value={filters.sort}
          >
            {PROFILE_SORT_OPTIONS.map((sort) => (
              <option key={sort} value={sort}>
                {sort.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-400">Order</span>
          <select
            aria-label="Sort order"
            className="h-10 rounded-xl border border-white/10 bg-slate-900 px-2 text-white"
            onChange={(event) =>
              onOrderChange(event.target.value as ListProfileGamesOrderEnum)
            }
            value={filters.order}
          >
            <option value={ListProfileGamesOrderEnum.Asc}>Ascending</option>
            <option value={ListProfileGamesOrderEnum.Desc}>Descending</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-400">Limit</span>
          <select
            aria-label="Items per page"
            className="h-10 rounded-xl border border-white/10 bg-slate-900 px-2 text-white"
            onChange={(event) => onLimitChange(Number.parseInt(event.target.value, 10))}
            value={filters.limit}
          >
            {PROFILE_LIMIT_OPTIONS.map((limit) => (
              <option key={limit} value={limit}>
                {limit}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-400">Page</span>
          <div className="flex items-center gap-2">
            <button
              className="h-10 rounded-xl border border-white/10 px-3 text-sm font-medium text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-600"
              disabled={!canGoPrev}
              onClick={(event) => {
                event.preventDefault();
                onPageChange(Math.max(0, filters.offset - filters.limit));
              }}
              type="button"
            >
              Prev
            </button>
            <button
              className="h-10 rounded-xl border border-white/10 px-3 text-sm font-medium text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-600"
              disabled={!canGoNext}
              onClick={(event) => {
                event.preventDefault();
                onPageChange(filters.offset + filters.limit);
              }}
              type="button"
            >
              Next
            </button>
          </div>
          <small className="text-xs text-slate-500">
            Showing {totalGames === 0 ? 0 : filters.offset + 1}–
            {Math.min(filters.offset + filters.limit, totalGames)} of {totalGames}
          </small>
        </label>
      </form>

      {totalGames === 0 ? (
        <EmptyState
          message="No games match the current filters. Try a different search or status."
          title="No matches"
        />
      ) : null}
    </DataToolbar>
  );
}
