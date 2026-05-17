import type { GetLeaderboardTypeEnum } from '@steam-achievement/client-sdk';

export interface LeaderboardQueryOptions {
  limit?: number;
  offset?: number;
}

export const leaderboardQueryKeys = {
  all: ['leaderboards'] as const,
  list: () => [...leaderboardQueryKeys.all, 'list'] as const,
  detail: (type: GetLeaderboardTypeEnum, options: LeaderboardQueryOptions = {}) =>
    [...leaderboardQueryKeys.all, type, options] as const,
};
