import { useQuery } from '@tanstack/react-query';

import { activityApi } from '@/lib/api/client';

import { activityQueryKeys, type ActivityQueryOptions } from './activity-query-keys';

export function useGlobalActivity(options: ActivityQueryOptions = {}) {
  return useQuery({
    queryKey: activityQueryKeys.global(options),
    queryFn: () => activityApi.listActivity(options),
  });
}
