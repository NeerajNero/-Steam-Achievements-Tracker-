import { useQuery } from '@tanstack/react-query';

import { gamesApi } from '@/lib/api/client';

import { profileQueryKeys } from './profile-query-keys';

export function useNearestCompletions(steamId: string, limit = 5) {
  return useQuery({
    queryKey: profileQueryKeys.nearestCompletions(steamId, limit),
    queryFn: () => gamesApi.listNearestCompletions({ steamId, limit }),
  });
}
