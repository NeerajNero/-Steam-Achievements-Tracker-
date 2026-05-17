import type { ListGameGuidesStatusEnum } from '@steam-achievement/client-sdk';

export interface GameGuidesQueryOptions {
  search?: string;
  limit?: number;
  offset?: number;
  status?: ListGameGuidesStatusEnum;
}

export const guideQueryKeys = {
  all: ['guides'] as const,
  gameLists: () => [...guideQueryKeys.all, 'game-list'] as const,
  gameList: (steamAppId: number, options: GameGuidesQueryOptions = {}) =>
    [...guideQueryKeys.gameLists(), steamAppId, options] as const,
  detail: (steamAppId: number, slug: string) =>
    [...guideQueryKeys.all, 'detail', steamAppId, slug] as const,
  account: () => [...guideQueryKeys.all, 'account'] as const,
  edit: (guideId: string) => [...guideQueryKeys.all, 'edit', guideId] as const,
};
