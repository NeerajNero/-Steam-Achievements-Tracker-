import {
  ListGlobalGamesOrderEnum,
  ListGlobalGamesSortEnum,
} from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { DataToolbar } from '@/components/ui/data-toolbar';

import { GLOBAL_GAMES_LIMIT_OPTIONS, type GlobalGamesFilters } from '../utils/global-game-filters';

const HAS_ACHIEVEMENTS_OPTIONS = [
  { label: 'All games', value: 'all' },
  { label: 'Has achievements', value: 'true' },
  { label: 'No achievements', value: 'false' },
] as const;

export function GlobalGamesFilters({
  filters,
  onHasAchievementsChange,
  onLimitChange,
  onOrderChange,
  onPageChange,
  onSearchChange,
  onSortChange,
  onSubmitSearch,
  searchInput,
  total,
}: Readonly<{
  filters: GlobalGamesFilters;
  onHasAchievementsChange: (value: boolean | undefined) => void;
  onLimitChange: (limit: number) => void;
  onOrderChange: (order: ListGlobalGamesOrderEnum) => void;
  onPageChange: (offset: number) => void;
  onSearchChange: (value: string) => void;
  onSortChange: (sort: ListGlobalGamesSortEnum) => void;
  onSubmitSearch: () => void;
  searchInput: string;
  total: number;
}>): ReactNode {
  const canGoPrev = filters.offset > 0;
  const canGoNext = filters.offset + filters.limit < total;
  const achievementFilterValue =
    filters.hasAchievements === undefined ? 'all' : String(filters.hasAchievements);

  return (
    <DataToolbar>
      <form
        className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr_0.6fr_0.7fr]"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmitSearch();
        }}
      >
        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-400">Search</span>
          <div className="flex gap-2">
            <input
              aria-label="Search tracked games"
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
          <span className="text-xs font-medium text-slate-400">Achievements</span>
          <select
            aria-label="Achievement support"
            className="h-10 rounded-xl border border-white/10 bg-slate-900 px-2 text-white"
            onChange={(event) => {
              const value = event.target.value;
              onHasAchievementsChange(value === 'all' ? undefined : value === 'true');
            }}
            value={achievementFilterValue}
          >
            {HAS_ACHIEVEMENTS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-400">Sort</span>
          <select
            aria-label="Sort tracked games by"
            className="h-10 rounded-xl border border-white/10 bg-slate-900 px-2 text-white"
            onChange={(event) =>
              onSortChange(event.target.value as ListGlobalGamesSortEnum)
            }
            value={filters.sort}
          >
            {Object.values(ListGlobalGamesSortEnum).map((sort) => (
              <option key={sort} value={sort}>
                {sort.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-400">Order</span>
          <select
            aria-label="Game sort order"
            className="h-10 rounded-xl border border-white/10 bg-slate-900 px-2 text-white"
            onChange={(event) =>
              onOrderChange(event.target.value as ListGlobalGamesOrderEnum)
            }
            value={filters.order}
          >
            <option value={ListGlobalGamesOrderEnum.Asc}>Ascending</option>
            <option value={ListGlobalGamesOrderEnum.Desc}>Descending</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-400">Limit</span>
          <select
            aria-label="Games per page"
            className="h-10 rounded-xl border border-white/10 bg-slate-900 px-2 text-white"
            onChange={(event) => onLimitChange(Number.parseInt(event.target.value, 10))}
            value={filters.limit}
          >
            {GLOBAL_GAMES_LIMIT_OPTIONS.map((limit) => (
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
            Showing {total === 0 ? 0 : filters.offset + 1}–
            {Math.min(filters.offset + filters.limit, total)} of {total}
          </small>
        </label>
      </form>
    </DataToolbar>
  );
}
