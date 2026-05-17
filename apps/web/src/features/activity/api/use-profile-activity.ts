import { useQuery } from '@tanstack/react-query';

import { activityApi } from '@/lib/api/client';

import {
  activityQueryKeys,
  type ScopedActivityQueryOptions,
} from './activity-query-keys';

export function useProfileActivity(
  steamId: string,
  options: ScopedActivityQueryOptions = {},
) {
  return useQuery({
    queryKey: activityQueryKeys.profile(steamId, options),
    queryFn: () => activityApi.listProfileActivity({ steamId, ...options }),
    enabled: steamId.length > 0,
  });
}
