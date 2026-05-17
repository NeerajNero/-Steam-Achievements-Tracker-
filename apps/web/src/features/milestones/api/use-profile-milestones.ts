import { useQuery } from '@tanstack/react-query';

import { milestonesApi } from '@/lib/api/client';

import {
  milestoneQueryKeys,
  type ProfileMilestonesQueryOptions,
} from './milestone-query-keys';

export function useProfileMilestones(
  steamId: string,
  options: ProfileMilestonesQueryOptions = {},
) {
  return useQuery({
    queryKey: milestoneQueryKeys.profile(steamId, options),
    queryFn: () => milestonesApi.listProfileMilestones({ steamId, ...options }),
    enabled: steamId.length > 0,
  });
}
