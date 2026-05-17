import { useQuery } from '@tanstack/react-query';

import { sessionsApi } from '@/lib/api/client';

import { sessionQueryKeys, type GameSessionsQueryOptions } from './session-query-keys';

export function useGameSessions(
  steamAppId: number,
  options: GameSessionsQueryOptions = {},
) {
  return useQuery({
    enabled: Number.isInteger(steamAppId) && steamAppId > 0,
    queryKey: sessionQueryKeys.gameList(steamAppId, options),
    queryFn: () => sessionsApi.listGameSessions({ steamAppId, ...options }),
  });
}
