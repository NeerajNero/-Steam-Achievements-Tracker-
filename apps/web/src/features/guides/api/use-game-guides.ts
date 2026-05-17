import { useQuery } from '@tanstack/react-query';

import { guidesApi } from '@/lib/api/client';

import { guideQueryKeys, type GameGuidesQueryOptions } from './guide-query-keys';

export function useGameGuides(
  steamAppId: number,
  options: GameGuidesQueryOptions = {},
) {
  return useQuery({
    enabled: Number.isInteger(steamAppId) && steamAppId > 0,
    queryKey: guideQueryKeys.gameList(steamAppId, options),
    queryFn: () => guidesApi.listGameGuides({ steamAppId, ...options }),
  });
}
