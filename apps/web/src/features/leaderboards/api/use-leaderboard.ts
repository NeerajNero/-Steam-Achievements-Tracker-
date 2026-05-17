import type { GetLeaderboardTypeEnum } from '@steam-achievement/client-sdk';
import { useQuery } from '@tanstack/react-query';

import { leaderboardsApi } from '@/lib/api/client';

import {
  leaderboardQueryKeys,
  type LeaderboardQueryOptions,
} from './leaderboard-query-keys';

export function useLeaderboard(
  type: GetLeaderboardTypeEnum,
  options: LeaderboardQueryOptions = {},
) {
  return useQuery({
    queryKey: leaderboardQueryKeys.detail(type, options),
    queryFn: () => leaderboardsApi.getLeaderboard({ type, ...options }),
  });
}
