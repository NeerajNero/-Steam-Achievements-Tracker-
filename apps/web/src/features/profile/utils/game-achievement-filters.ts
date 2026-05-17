import {
  ListGameAchievementsOrderEnum,
  ListGameAchievementsSortEnum,
  ListGameAchievementsStatusEnum,
} from '@steam-achievement/client-sdk';

const DEFAULT_STATUS = ListGameAchievementsStatusEnum.All;
const DEFAULT_SORT = ListGameAchievementsSortEnum.Rarity;
const DEFAULT_ORDER = ListGameAchievementsOrderEnum.Asc;

export interface GameAchievementFilters {
  status: ListGameAchievementsStatusEnum;
  sort: ListGameAchievementsSortEnum;
  order: ListGameAchievementsOrderEnum;
}

function isGameAchievementsStatus(
  value: string | null,
): value is ListGameAchievementsStatusEnum {
  return (
    value !== null &&
    Object.values(ListGameAchievementsStatusEnum).includes(
      value as ListGameAchievementsStatusEnum,
    )
  );
}

function isGameAchievementsSort(value: string | null): value is ListGameAchievementsSortEnum {
  return (
    value !== null &&
    Object.values(ListGameAchievementsSortEnum).includes(value as ListGameAchievementsSortEnum)
  );
}

function isGameAchievementsOrder(value: string | null): value is ListGameAchievementsOrderEnum {
  return (
    value !== null &&
    Object.values(ListGameAchievementsOrderEnum).includes(
      value as ListGameAchievementsOrderEnum,
    )
  );
}

export function parseGameAchievementFilters(
  searchParams: URLSearchParams,
): GameAchievementFilters {
  const status =
    searchParams.get('status') !== null &&
    isGameAchievementsStatus(searchParams.get('status'))
      ? (searchParams.get('status') as ListGameAchievementsStatusEnum)
      : DEFAULT_STATUS;

  const sort =
    searchParams.get('sort') !== null &&
    isGameAchievementsSort(searchParams.get('sort'))
      ? (searchParams.get('sort') as ListGameAchievementsSortEnum)
      : DEFAULT_SORT;

  const order =
    searchParams.get('order') !== null &&
    isGameAchievementsOrder(searchParams.get('order'))
      ? (searchParams.get('order') as ListGameAchievementsOrderEnum)
      : DEFAULT_ORDER;

  return {
    status,
    sort,
    order,
  };
}

export function toGameAchievementSearchParams(filters: GameAchievementFilters): string {
  const params = new URLSearchParams();

  params.set('status', filters.status);
  params.set('sort', filters.sort);
  params.set('order', filters.order);

  return params.toString();
}

export const DEFAULT_GAME_ACHIEVEMENT_FILTERS: GameAchievementFilters = {
  status: DEFAULT_STATUS,
  sort: DEFAULT_SORT,
  order: DEFAULT_ORDER,
};

