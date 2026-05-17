import type {
  ListGameSessionsStatusEnum,
  ListGlobalSessionsStatusEnum,
} from '@steam-achievement/client-sdk';

export interface GlobalSessionsQueryOptions {
  status?: ListGlobalSessionsStatusEnum;
  steamAppId?: number;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface GameSessionsQueryOptions {
  status?: ListGameSessionsStatusEnum;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export const sessionQueryKeys = {
  all: ['sessions'] as const,
  globalList: (options: GlobalSessionsQueryOptions = {}) =>
    [...sessionQueryKeys.all, 'global', options] as const,
  gameList: (steamAppId: number, options: GameSessionsQueryOptions = {}) =>
    [...sessionQueryKeys.all, 'game', steamAppId, options] as const,
  detail: (sessionId: string) =>
    [...sessionQueryKeys.all, 'detail', sessionId] as const,
};
