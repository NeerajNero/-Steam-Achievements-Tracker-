import { useQuery } from '@tanstack/react-query';

import { leaderboardsApi } from '@/lib/api/client';

import { leaderboardQueryKeys } from './leaderboard-query-keys';

export function useLeaderboards() {
  return useQuery({
    queryKey: leaderboardQueryKeys.list(),
    queryFn: () => leaderboardsApi.listLeaderboards(),
  });
}
