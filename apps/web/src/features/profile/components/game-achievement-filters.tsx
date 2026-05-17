import {
  ListGameAchievementsOrderEnum,
  ListGameAchievementsSortEnum,
  ListGameAchievementsStatusEnum,
} from '@steam-achievement/client-sdk';

import { DataToolbar } from '@/components/ui/data-toolbar';

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
  const labelClassName = 'grid gap-1 text-xs font-semibold uppercase text-slate-400';
  const selectClassName =
    'h-10 rounded-xl border border-white/10 bg-slate-950/80 px-3 text-sm font-medium text-slate-100 outline-none focus:border-lime-400';

  return (
    <div className="mt-4">
      <DataToolbar>
        <label className={labelClassName}>
          Status
          <select
            aria-label="Filter achievements by status"
            className={selectClassName}
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
        <label className={labelClassName}>
          Sort
          <select
            aria-label="Sort achievements by"
            className={selectClassName}
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
        <label className={labelClassName}>
          Order
          <select
            aria-label="Sort order"
            className={selectClassName}
            onChange={(event) =>
              onOrderChange(event.target.value as ListGameAchievementsOrderEnum)
            }
            value={filters.order}
          >
            <option value={ListGameAchievementsOrderEnum.Asc}>Ascending</option>
            <option value={ListGameAchievementsOrderEnum.Desc}>Descending</option>
          </select>
        </label>
      </DataToolbar>
    </div>
  );
}
