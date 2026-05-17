import type {
  ListGlobalGameAchievementsHiddenEnum,
  ListGlobalGameAchievementsOrderEnum,
  ListGlobalGameAchievementsSortEnum,
  ListGlobalGamePlayersOrderEnum,
  ListGlobalGamePlayersSortEnum,
  ListGlobalGamePlayersStatusEnum,
  ListGlobalGamesOrderEnum,
  ListGlobalGamesSortEnum,
} from '@steam-achievement/client-sdk';

export interface GlobalGamesQueryOptions {
  search?: string;
  hasAchievements?: boolean;
  sort?: ListGlobalGamesSortEnum;
  order?: ListGlobalGamesOrderEnum;
  limit?: number;
  offset?: number;
}

export interface GlobalGameAchievementsQueryOptions {
  search?: string;
  hidden?: ListGlobalGameAchievementsHiddenEnum;
  sort?: ListGlobalGameAchievementsSortEnum;
  order?: ListGlobalGameAchievementsOrderEnum;
  limit?: number;
  offset?: number;
}

export interface GlobalGamePlayersQueryOptions {
  status?: ListGlobalGamePlayersStatusEnum;
  sort?: ListGlobalGamePlayersSortEnum;
  order?: ListGlobalGamePlayersOrderEnum;
  limit?: number;
  offset?: number;
}

export const gameQueryKeys = {
  all: ['games'] as const,
  list: (options: GlobalGamesQueryOptions = {}) =>
    [...gameQueryKeys.all, 'list', options] as const,
  detail: (steamAppId: number) =>
    [...gameQueryKeys.all, steamAppId, 'detail'] as const,
  achievements: (
    steamAppId: number,
    options: GlobalGameAchievementsQueryOptions = {},
  ) => [...gameQueryKeys.all, steamAppId, 'achievements', options] as const,
  players: (steamAppId: number, options: GlobalGamePlayersQueryOptions = {}) =>
    [...gameQueryKeys.all, steamAppId, 'players', options] as const,
};
