import { useQuery } from '@tanstack/react-query';

import { achievementsApi } from '@/lib/api/client';

import type { GameAchievementsQueryOptions } from './profile-query-keys';
import { profileQueryKeys } from './profile-query-keys';

export function useGameAchievements(
  steamId: string,
  steamAppId: number,
  options: GameAchievementsQueryOptions = {},
) {
  return useQuery({
    queryKey: profileQueryKeys.gameAchievements(steamId, steamAppId, options),
    queryFn: () =>
      achievementsApi.listGameAchievements({
        steamId,
        steamAppId,
        ...options,
      }),
  });
}
