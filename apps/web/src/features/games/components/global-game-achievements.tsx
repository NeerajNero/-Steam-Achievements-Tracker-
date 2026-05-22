import {
  ListGlobalGameAchievementsHiddenEnum,
  ListGlobalGameAchievementsOrderEnum,
  ListGlobalGameAchievementsSortEnum,
  type GlobalGameAchievementResponseDto,
} from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/panel-state';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { AchievementTargetButton } from '@/features/targets/components/target-button';
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
    <SectionCard
      description="Canonical achievement metadata and global rarity from stored Steam data. Unknown player unlock state is never presented as locked here."
      title="Achievements"
    >
        <form
          className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr_0.6fr_0.7fr]"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmitSearch();
          }}
        >
          <label className="grid gap-1">
            <span className="text-xs font-medium text-slate-400">Search</span>
            <div className="flex gap-2">
              <input
                aria-label="Search achievements"
                className="h-10 flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-300 focus:ring-2 focus:ring-lime-300/20"
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Name or API name"
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
            <span className="text-xs font-medium text-slate-400">Hidden</span>
            <select
              aria-label="Achievement hidden filter"
              className="h-10 rounded-xl border border-white/10 bg-slate-900 px-2 text-white"
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
            <span className="text-xs font-medium text-slate-400">Sort</span>
            <select
              aria-label="Achievement sort"
              className="h-10 rounded-xl border border-white/10 bg-slate-900 px-2 text-white"
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
            <span className="text-xs font-medium text-slate-400">Order</span>
            <select
              aria-label="Achievement sort order"
              className="h-10 rounded-xl border border-white/10 bg-slate-900 px-2 text-white"
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
            <span className="text-xs font-medium text-slate-400">Limit</span>
            <select
              aria-label="Achievements per page"
              className="h-10 rounded-xl border border-white/10 bg-slate-900 px-2 text-white"
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
            <span className="text-xs font-medium text-slate-400">Page</span>
            <div className="flex gap-2">
              <button
                className="h-10 rounded-xl border border-white/10 px-3 text-sm font-medium text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-600"
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
                className="h-10 rounded-xl border border-white/10 px-3 text-sm font-medium text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-600"
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

      {isLoading ? <LoadingState message="Loading achievement metadata..." /> : null}
      {isError ? (
        <div className="p-4">
          <ErrorState message={getErrorMessage(error)} />
        </div>
      ) : null}
      {items && items.length === 0 ? (
        <EmptyState
          message="No achievements match the current filters. That can mean the search is too narrow or the game does not expose matching metadata yet."
        />
      ) : null}

      {items && items.length > 0 ? (
        <ul className="mt-5 divide-y divide-white/10">
          {items.map((achievement) => (
            <li
              className="grid gap-4 p-4 md:grid-cols-[48px_1fr_auto]"
              key={achievement.apiName}
            >
              {achievement.iconUrl || achievement.iconGrayUrl ? (
                <img
                  alt=""
                  className="h-12 w-12 rounded-xl border border-white/10"
                  src={achievement.iconUrl ?? achievement.iconGrayUrl ?? ''}
                />
              ) : (
                <div className="h-12 w-12 rounded-xl border border-white/10 bg-white/5" />
              )}
              <div>
                <div className="font-medium text-white">
                  {achievement.displayName ?? achievement.apiName}
                </div>
                {achievement.description ? (
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {achievement.description}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>{achievement.apiName}</span>
                  {achievement.hidden ? <span>Hidden</span> : <span>Visible</span>}
                </div>
              </div>
              <div className="md:text-right">
                <StatusBadge tone="info">
                  {achievement.globalPercentage === undefined ||
                  achievement.globalPercentage === null
                    ? 'Unknown rarity'
                    : formatPercent(achievement.globalPercentage)}
                </StatusBadge>
                <div className="mt-3">
                  <AchievementTargetButton achievementId={achievement.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </SectionCard>
  );
}
