import {
  ListGameAchievementsOrderEnum,
  ListGameAchievementsSortEnum,
  ListGameAchievementsStatusEnum,
} from '@steam-achievement/client-sdk';

import type { GameAchievementFilters } from '../utils/game-achievement-filters';

export const GAME_ACHIEVEMENT_STATUS_OPTIONS: readonly ListGameAchievementsStatusEnum[] = [
  ListGameAchievementsStatusEnum.All,
  ListGameAchievementsStatusEnum.Unlocked,
  ListGameAchievementsStatusEnum.Locked,
];

export const GAME_ACHIEVEMENT_SORT_OPTIONS: readonly ListGameAchievementsSortEnum[] = [
  ListGameAchievementsSortEnum.Rarity,
  ListGameAchievementsSortEnum.UnlockedAt,
  ListGameAchievementsSortEnum.Name,
];

export function GameAchievementFilters({
  filters,
  onStatusChange,
  onSortChange,
  onOrderChange,
}: Readonly<{
  filters: GameAchievementFilters;
  onStatusChange: (status: ListGameAchievementsStatusEnum) => void;
  onSortChange: (sort: ListGameAchievementsSortEnum) => void;
  onOrderChange: (order: ListGameAchievementsOrderEnum) => void;
}>): React.ReactNode {
  return (
    <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Filters</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-600">Status</span>
          <select
            aria-label="Filter achievements by status"
            className="h-10 rounded-md border border-slate-300 px-2"
            onChange={(event) =>
              onStatusChange(event.target.value as ListGameAchievementsStatusEnum)
            }
            value={filters.status}
          >
            {GAME_ACHIEVEMENT_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-600">Sort</span>
          <select
            aria-label="Sort achievements by"
            className="h-10 rounded-md border border-slate-300 px-2"
            onChange={(event) =>
              onSortChange(event.target.value as ListGameAchievementsSortEnum)
            }
            value={filters.sort}
          >
            {GAME_ACHIEVEMENT_SORT_OPTIONS.map((sort) => (
              <option key={sort} value={sort}>
                {sort}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-600">Order</span>
          <select
            aria-label="Sort order"
            className="h-10 rounded-md border border-slate-300 px-2"
            onChange={(event) =>
              onOrderChange(event.target.value as ListGameAchievementsOrderEnum)
            }
            value={filters.order}
          >
            <option value={ListGameAchievementsOrderEnum.Asc}>Ascending</option>
            <option value={ListGameAchievementsOrderEnum.Desc}>Descending</option>
          </select>
        </label>
      </div>
    </section>
  );
}
