import { useQuery } from '@tanstack/react-query';

import { gamesApi } from '@/lib/api/client';

import {
  gameQueryKeys,
  type GlobalGameAchievementsQueryOptions,
} from './game-query-keys';

export function useGlobalGameAchievements(
  steamAppId: number,
  options: GlobalGameAchievementsQueryOptions = {},
) {
  return useQuery({
    enabled: Number.isInteger(steamAppId) && steamAppId > 0,
    queryKey: gameQueryKeys.achievements(steamAppId, options),
    queryFn: () => gamesApi.listGlobalGameAchievements({ steamAppId, ...options }),
  });
}
