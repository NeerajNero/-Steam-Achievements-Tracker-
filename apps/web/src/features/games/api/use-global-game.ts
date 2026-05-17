import { useQuery } from '@tanstack/react-query';

import { gamesApi } from '@/lib/api/client';

import { gameQueryKeys } from './game-query-keys';

export function useGlobalGame(steamAppId: number) {
  return useQuery({
    enabled: Number.isInteger(steamAppId) && steamAppId > 0,
    queryKey: gameQueryKeys.detail(steamAppId),
    queryFn: () => gamesApi.getGlobalGame({ steamAppId }),
  });
}
