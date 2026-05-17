import {
  ListGlobalGamesOrderEnum,
  ListGlobalGamesSortEnum,
} from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

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
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-950">Steam Games</h2>
      <p className="mt-1 text-sm text-slate-600">
        Browse games already tracked in the local platform database.
      </p>

      <form
        className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr_0.6fr_0.7fr]"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmitSearch();
        }}
      >
        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-600">Search</span>
          <div className="flex gap-2">
            <input
              aria-label="Search tracked games"
              className="h-10 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by game name"
              type="text"
              value={searchInput}
            />
            <button
              className="rounded-md bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800"
              type="submit"
            >
              Apply
            </button>
          </div>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-600">Achievements</span>
          <select
            aria-label="Achievement support"
            className="h-10 rounded-md border border-slate-300 px-2"
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
          <span className="text-xs font-medium text-slate-600">Sort</span>
          <select
            aria-label="Sort tracked games by"
            className="h-10 rounded-md border border-slate-300 px-2"
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
          <span className="text-xs font-medium text-slate-600">Order</span>
          <select
            aria-label="Game sort order"
            className="h-10 rounded-md border border-slate-300 px-2"
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
          <span className="text-xs font-medium text-slate-600">Limit</span>
          <select
            aria-label="Games per page"
            className="h-10 rounded-md border border-slate-300 px-2"
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
          <span className="text-xs font-medium text-slate-600">Page</span>
          <div className="flex items-center gap-2">
            <button
              className="h-10 rounded-md border border-slate-300 px-3 text-sm font-medium disabled:cursor-not-allowed disabled:text-slate-300"
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
              className="h-10 rounded-md border border-slate-300 px-3 text-sm font-medium disabled:cursor-not-allowed disabled:text-slate-300"
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
    </section>
  );
}
