import type { ListActivityEventTypeEnum } from '@steam-achievement/client-sdk';

export interface ActivityQueryOptions {
  eventType?: ListActivityEventTypeEnum;
  limit?: number;
  offset?: number;
}

export interface ScopedActivityQueryOptions {
  limit?: number;
  offset?: number;
}

export const activityQueryKeys = {
  all: ['activity'] as const,
  global: (options: ActivityQueryOptions = {}) =>
    [...activityQueryKeys.all, 'global', options] as const,
  profile: (steamId: string, options: ScopedActivityQueryOptions = {}) =>
    [...activityQueryKeys.all, 'profile', steamId, options] as const,
  game: (steamAppId: number, options: ScopedActivityQueryOptions = {}) =>
    [...activityQueryKeys.all, 'game', steamAppId, options] as const,
};
