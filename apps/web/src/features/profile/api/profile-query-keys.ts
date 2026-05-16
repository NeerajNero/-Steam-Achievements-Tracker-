import type {
  ListGameAchievementsOrderEnum,
  ListGameAchievementsSortEnum,
  ListGameAchievementsStatusEnum,
  ListProfileGamesOrderEnum,
  ListProfileGamesSortEnum,
  ListProfileGamesStatusEnum,
} from '@steam-achievement/client-sdk';

export interface ProfileGamesQueryOptions {
  offset?: number;
  limit?: number;
  order?: ListProfileGamesOrderEnum;
  sort?: ListProfileGamesSortEnum;
  status?: ListProfileGamesStatusEnum;
  search?: string;
}

export interface GameAchievementsQueryOptions {
  order?: ListGameAchievementsOrderEnum;
  sort?: ListGameAchievementsSortEnum;
  status?: ListGameAchievementsStatusEnum;
}

export const profileQueryKeys = {
  all: ['profiles'] as const,
  profile: (steamId: string) => [...profileQueryKeys.all, steamId] as const,
  detail: (steamId: string) =>
    [...profileQueryKeys.profile(steamId), 'detail'] as const,
  summary: (steamId: string) =>
    [...profileQueryKeys.profile(steamId), 'summary'] as const,
  games: (steamId: string, options: ProfileGamesQueryOptions = {}) =>
    [...profileQueryKeys.profile(steamId), 'games', options] as const,
  game: (steamId: string, steamAppId: number) =>
    [...profileQueryKeys.profile(steamId), 'games', steamAppId] as const,
  gameAchievements: (
    steamId: string,
    steamAppId: number,
    options: GameAchievementsQueryOptions = {},
  ) =>
    [
      ...profileQueryKeys.game(steamId, steamAppId),
      'achievements',
      options,
    ] as const,
  nearestCompletions: (steamId: string, limit: number) =>
    [...profileQueryKeys.profile(steamId), 'nearest-completions', limit] as const,
  rarestAchievements: (steamId: string, limit: number) =>
    [...profileQueryKeys.profile(steamId), 'rarest-achievements', limit] as const,
  syncRuns: (steamId: string, limit: number) =>
    [...profileQueryKeys.profile(steamId), 'sync-runs', limit] as const,
};
