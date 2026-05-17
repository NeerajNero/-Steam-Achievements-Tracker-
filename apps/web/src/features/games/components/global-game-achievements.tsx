import {
  ListGlobalGameAchievementsHiddenEnum,
  ListGlobalGameAchievementsOrderEnum,
  ListGlobalGameAchievementsSortEnum,
  type GlobalGameAchievementResponseDto,
} from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { formatPercent, getErrorMessage } from '@/lib/format';

import {
  GLOBAL_GAME_ACHIEVEMENT_LIMIT_OPTIONS,
  type GlobalGameAchievementFilters,
} from '../utils/global-game-filters';

export function GlobalGameAchievements({
  error,
  filters,
  isError,
  isLoading,
  items,
  onFiltersChange,
  searchInput,
  onSearchChange,
  onSubmitSearch,
  total,
}: Readonly<{
  error: unknown;
  filters: GlobalGameAchievementFilters;
  isError: boolean;
  isLoading: boolean;
  items: readonly GlobalGameAchievementResponseDto[] | undefined;
  onFiltersChange: (filters: Partial<GlobalGameAchievementFilters>) => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onSubmitSearch: () => void;
  total: number | undefined;
}>): ReactNode {
  const totalItems = total ?? 0;
  const canGoPrev = filters.offset > 0;
  const canGoNext = filters.offset + filters.limit < totalItems;

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-xl font-semibold text-slate-950">Achievements</h2>
        <p className="mt-1 text-sm text-slate-600">
          Canonical achievement metadata and global rarity from stored Steam data.
        </p>

        <form
          className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr_0.6fr_0.7fr]"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmitSearch();
          }}
        >
          <label className="grid gap-1">
            <span className="text-xs font-medium text-slate-600">Search</span>
            <div className="flex gap-2">
              <input
                aria-label="Search achievements"
                className="h-10 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Name or API name"
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
            <span className="text-xs font-medium text-slate-600">Hidden</span>
            <select
              aria-label="Achievement hidden filter"
              className="h-10 rounded-md border border-slate-300 px-2"
              onChange={(event) =>
                onFiltersChange({
                  hidden: event.target.value as ListGlobalGameAchievementsHiddenEnum,
                  offset: 0,
                })
              }
              value={filters.hidden}
            >
              {Object.values(ListGlobalGameAchievementsHiddenEnum).map((hidden) => (
                <option key={hidden} value={hidden}>
                  {hidden}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-slate-600">Sort</span>
            <select
              aria-label="Achievement sort"
              className="h-10 rounded-md border border-slate-300 px-2"
              onChange={(event) =>
                onFiltersChange({
                  sort: event.target.value as ListGlobalGameAchievementsSortEnum,
                  offset: 0,
                })
              }
              value={filters.sort}
            >
              {Object.values(ListGlobalGameAchievementsSortEnum).map((sort) => (
                <option key={sort} value={sort}>
                  {sort}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-slate-600">Order</span>
            <select
              aria-label="Achievement sort order"
              className="h-10 rounded-md border border-slate-300 px-2"
              onChange={(event) =>
                onFiltersChange({
                  order: event.target.value as ListGlobalGameAchievementsOrderEnum,
                })
              }
              value={filters.order}
            >
              <option value={ListGlobalGameAchievementsOrderEnum.Asc}>Ascending</option>
              <option value={ListGlobalGameAchievementsOrderEnum.Desc}>Descending</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-slate-600">Limit</span>
            <select
              aria-label="Achievements per page"
              className="h-10 rounded-md border border-slate-300 px-2"
              onChange={(event) =>
                onFiltersChange({
                  limit: Number.parseInt(event.target.value, 10),
                  offset: 0,
                })
              }
              value={filters.limit}
            >
              {GLOBAL_GAME_ACHIEVEMENT_LIMIT_OPTIONS.map((limit) => (
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
                onClick={(event) => {
                  event.preventDefault();
                  onFiltersChange({
                    offset: Math.max(0, filters.offset - filters.limit),
                  });
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
                  onFiltersChange({ offset: filters.offset + filters.limit });
                }}
                type="button"
              >
                Next
              </button>
            </div>
          </label>
        </form>
      </div>

      {isLoading ? <LoadingState message="Loading achievement metadata..." /> : null}
      {isError ? (
        <div className="p-4">
          <ErrorState message={getErrorMessage(error)} />
        </div>
      ) : null}
      {items && items.length === 0 ? (
        <EmptyState message="No achievements match the current filters." />
      ) : null}

      {items && items.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {items.map((achievement) => (
            <li
              className="grid gap-4 p-4 md:grid-cols-[48px_1fr_auto]"
              key={achievement.apiName}
            >
              {achievement.iconUrl || achievement.iconGrayUrl ? (
                <img
                  alt=""
                  className="h-12 w-12 rounded-md border border-slate-200"
                  src={achievement.iconUrl ?? achievement.iconGrayUrl ?? ''}
                />
              ) : (
                <div className="h-12 w-12 rounded-md border border-slate-200 bg-slate-100" />
              )}
              <div>
                <div className="font-medium text-slate-950">
                  {achievement.displayName ?? achievement.apiName}
                </div>
                {achievement.description ? (
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {achievement.description}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>{achievement.apiName}</span>
                  {achievement.hidden ? <span>Hidden</span> : <span>Visible</span>}
                </div>
              </div>
              <div className="md:text-right">
                <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                  {achievement.globalPercentage === undefined ||
                  achievement.globalPercentage === null
                    ? 'Unknown rarity'
                    : formatPercent(achievement.globalPercentage)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
