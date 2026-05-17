import { useQuery } from '@tanstack/react-query';

import { activityApi } from '@/lib/api/client';

import {
  activityQueryKeys,
  type ScopedActivityQueryOptions,
} from './activity-query-keys';

export function useGameActivity(
  steamAppId: number,
  options: ScopedActivityQueryOptions = {},
) {
  return useQuery({
    queryKey: activityQueryKeys.game(steamAppId, options),
    queryFn: () => activityApi.listGameActivity({ steamAppId, ...options }),
    enabled: Number.isFinite(steamAppId),
  });
}
