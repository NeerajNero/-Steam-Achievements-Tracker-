import { useQuery } from '@tanstack/react-query';

import { gamesApi } from '@/lib/api/client';

import { gameQueryKeys, type GlobalGamesQueryOptions } from './game-query-keys';

export function useGlobalGames(options: GlobalGamesQueryOptions = {}) {
  return useQuery({
    queryKey: gameQueryKeys.list(options),
    queryFn: () => gamesApi.listGlobalGames(options),
  });
}
