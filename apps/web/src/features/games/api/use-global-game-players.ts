import { useQuery } from '@tanstack/react-query';

import { gamesApi } from '@/lib/api/client';

import { gameQueryKeys, type GlobalGamePlayersQueryOptions } from './game-query-keys';

export function useGlobalGamePlayers(
  steamAppId: number,
  options: GlobalGamePlayersQueryOptions = {},
) {
  return useQuery({
    enabled: Number.isInteger(steamAppId) && steamAppId > 0,
    queryKey: gameQueryKeys.players(steamAppId, options),
    queryFn: () => gamesApi.listGlobalGamePlayers({ steamAppId, ...options }),
  });
}
