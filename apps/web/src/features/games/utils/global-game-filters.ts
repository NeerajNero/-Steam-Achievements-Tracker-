import {
  ListGlobalGameAchievementsHiddenEnum,
  ListGlobalGameAchievementsOrderEnum,
  ListGlobalGameAchievementsSortEnum,
  ListGlobalGamePlayersOrderEnum,
  ListGlobalGamePlayersSortEnum,
  ListGlobalGamePlayersStatusEnum,
  ListGlobalGamesOrderEnum,
  ListGlobalGamesSortEnum,
} from '@steam-achievement/client-sdk';

export const GLOBAL_GAMES_LIMIT_OPTIONS = [10, 25, 50, 100] as const;
export const GLOBAL_GAME_ACHIEVEMENT_LIMIT_OPTIONS = [25, 50, 100, 250, 500] as const;
export const GLOBAL_GAME_PLAYER_LIMIT_OPTIONS = [10, 25, 50, 100] as const;

const DEFAULT_GAMES_SORT = ListGlobalGamesSortEnum.TrackedPlayers;
const DEFAULT_GAMES_ORDER = ListGlobalGamesOrderEnum.Desc;
const DEFAULT_GAMES_LIMIT = 25;
const DEFAULT_OFFSET = 0;

const DEFAULT_ACHIEVEMENT_HIDDEN = ListGlobalGameAchievementsHiddenEnum.All;
const DEFAULT_ACHIEVEMENT_SORT = ListGlobalGameAchievementsSortEnum.Rarity;
const DEFAULT_ACHIEVEMENT_ORDER = ListGlobalGameAchievementsOrderEnum.Asc;
const DEFAULT_ACHIEVEMENT_LIMIT = 100;

const DEFAULT_PLAYER_STATUS = ListGlobalGamePlayersStatusEnum.All;
const DEFAULT_PLAYER_SORT = ListGlobalGamePlayersSortEnum.Completion;
const DEFAULT_PLAYER_ORDER = ListGlobalGamePlayersOrderEnum.Desc;
const DEFAULT_PLAYER_LIMIT = 25;

export interface GlobalGamesFilters {
  search: string;
  hasAchievements: boolean | undefined;
  sort: ListGlobalGamesSortEnum;
  order: ListGlobalGamesOrderEnum;
  limit: number;
  offset: number;
}

export interface GlobalGameAchievementFilters {
  search: string;
  hidden: ListGlobalGameAchievementsHiddenEnum;
  sort: ListGlobalGameAchievementsSortEnum;
  order: ListGlobalGameAchievementsOrderEnum;
  limit: number;
  offset: number;
}

export interface GlobalGamePlayerFilters {
  status: ListGlobalGamePlayersStatusEnum;
  sort: ListGlobalGamePlayersSortEnum;
  order: ListGlobalGamePlayersOrderEnum;
  limit: number;
  offset: number;
}

export function parseGlobalGamesFilters(
  searchParams: URLSearchParams,
): GlobalGamesFilters {
  return normalizeGlobalGamesFilters({
    search: searchParams.get('search') ?? '',
    hasAchievements: parseOptionalBoolean(searchParams.get('hasAchievements')),
    sort: parseEnum(searchParams.get('sort'), ListGlobalGamesSortEnum),
    order: parseEnum(searchParams.get('order'), ListGlobalGamesOrderEnum),
    limit: parseInteger(searchParams.get('limit')),
    offset: parseInteger(searchParams.get('offset')),
  });
}

export function normalizeGlobalGamesFilters(
  partial: Partial<GlobalGamesFilters>,
): GlobalGamesFilters {
  return {
    search: partial.search?.trim() ?? '',
    hasAchievements: partial.hasAchievements,
    sort: isEnumValue(partial.sort, ListGlobalGamesSortEnum)
      ? partial.sort
      : DEFAULT_GAMES_SORT,
    order: isEnumValue(partial.order, ListGlobalGamesOrderEnum)
      ? partial.order
      : DEFAULT_GAMES_ORDER,
    limit: normalizeLimit(partial.limit, 1, 100, DEFAULT_GAMES_LIMIT),
    offset: normalizeOffset(partial.offset),
  };
}

export function toGlobalGamesSearchParams(filters: GlobalGamesFilters): string {
  const params = new URLSearchParams();

  if (filters.search.length > 0) {
    params.set('search', filters.search);
  }

  if (filters.hasAchievements !== undefined) {
    params.set('hasAchievements', String(filters.hasAchievements));
  }

  params.set('sort', filters.sort);
  params.set('order', filters.order);
  params.set('limit', String(filters.limit));
  params.set('offset', String(filters.offset));

  return params.toString();
}

export function parseGlobalGameAchievementFilters(
  searchParams: URLSearchParams,
): GlobalGameAchievementFilters {
  return normalizeGlobalGameAchievementFilters({
    search: searchParams.get('achievementSearch') ?? '',
    hidden: parseEnum(
      searchParams.get('hidden'),
      ListGlobalGameAchievementsHiddenEnum,
    ),
    sort: parseEnum(
      searchParams.get('achievementSort'),
      ListGlobalGameAchievementsSortEnum,
    ),
    order: parseEnum(
      searchParams.get('achievementOrder'),
      ListGlobalGameAchievementsOrderEnum,
    ),
    limit: parseInteger(searchParams.get('achievementLimit')),
    offset: parseInteger(searchParams.get('achievementOffset')),
  });
}

export function normalizeGlobalGameAchievementFilters(
  partial: Partial<GlobalGameAchievementFilters>,
): GlobalGameAchievementFilters {
  return {
    search: partial.search?.trim() ?? '',
    hidden: isEnumValue(partial.hidden, ListGlobalGameAchievementsHiddenEnum)
      ? partial.hidden
      : DEFAULT_ACHIEVEMENT_HIDDEN,
    sort: isEnumValue(partial.sort, ListGlobalGameAchievementsSortEnum)
      ? partial.sort
      : DEFAULT_ACHIEVEMENT_SORT,
    order: isEnumValue(partial.order, ListGlobalGameAchievementsOrderEnum)
      ? partial.order
      : DEFAULT_ACHIEVEMENT_ORDER,
    limit: normalizeLimit(partial.limit, 1, 500, DEFAULT_ACHIEVEMENT_LIMIT),
    offset: normalizeOffset(partial.offset),
  };
}

export function parseGlobalGamePlayerFilters(
  searchParams: URLSearchParams,
): GlobalGamePlayerFilters {
  return normalizeGlobalGamePlayerFilters({
    status: parseEnum(searchParams.get('playerStatus'), ListGlobalGamePlayersStatusEnum),
    sort: parseEnum(searchParams.get('playerSort'), ListGlobalGamePlayersSortEnum),
    order: parseEnum(searchParams.get('playerOrder'), ListGlobalGamePlayersOrderEnum),
    limit: parseInteger(searchParams.get('playerLimit')),
    offset: parseInteger(searchParams.get('playerOffset')),
  });
}

export function normalizeGlobalGamePlayerFilters(
  partial: Partial<GlobalGamePlayerFilters>,
): GlobalGamePlayerFilters {
  return {
    status: isEnumValue(partial.status, ListGlobalGamePlayersStatusEnum)
      ? partial.status
      : DEFAULT_PLAYER_STATUS,
    sort: isEnumValue(partial.sort, ListGlobalGamePlayersSortEnum)
      ? partial.sort
      : DEFAULT_PLAYER_SORT,
    order: isEnumValue(partial.order, ListGlobalGamePlayersOrderEnum)
      ? partial.order
      : DEFAULT_PLAYER_ORDER,
    limit: normalizeLimit(partial.limit, 1, 100, DEFAULT_PLAYER_LIMIT),
    offset: normalizeOffset(partial.offset),
  };
}

export function toGlobalGameDetailSearchParams(
  achievements: GlobalGameAchievementFilters,
  players: GlobalGamePlayerFilters,
): string {
  const params = new URLSearchParams();

  if (achievements.search.length > 0) {
    params.set('achievementSearch', achievements.search);
  }

  params.set('hidden', achievements.hidden);
  params.set('achievementSort', achievements.sort);
  params.set('achievementOrder', achievements.order);
  params.set('achievementLimit', String(achievements.limit));
  params.set('achievementOffset', String(achievements.offset));
  params.set('playerStatus', players.status);
  params.set('playerSort', players.sort);
  params.set('playerOrder', players.order);
  params.set('playerLimit', String(players.limit));
  params.set('playerOffset', String(players.offset));

  return params.toString();
}

export function getGlobalGamePlayerHref({
  publicSlug,
  steamId,
}: Readonly<{
  publicSlug?: string | null;
  steamId: string;
}>): string {
  return publicSlug ? `/u/${publicSlug}` : `/profiles/${steamId}`;
}

function parseOptionalBoolean(value: string | null): boolean | undefined {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

function parseInteger(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) ? parsed : undefined;
}

function normalizeLimit(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  return value !== undefined && value >= min && value <= max ? value : fallback;
}

function normalizeOffset(value: number | undefined): number {
  return value !== undefined && value >= 0 ? value : DEFAULT_OFFSET;
}

function parseEnum<T extends Record<string, string>>(
  value: string | null,
  options: T,
): T[keyof T] | undefined {
  return Object.values(options).includes(value ?? '') ? (value as T[keyof T]) : undefined;
}

function isEnumValue<T extends Record<string, string>>(
  value: unknown,
  options: T,
): value is T[keyof T] {
  return typeof value === 'string' && Object.values(options).includes(value);
}
