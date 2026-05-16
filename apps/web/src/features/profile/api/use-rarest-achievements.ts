import { useQuery } from '@tanstack/react-query';

import { achievementsApi } from '@/lib/api/client';

import { profileQueryKeys } from './profile-query-keys';

export function useRarestAchievements(steamId: string, limit = 5) {
  return useQuery({
    queryKey: profileQueryKeys.rarestAchievements(steamId, limit),
    queryFn: () => achievementsApi.listRarestAchievements({ steamId, limit }),
  });
}
