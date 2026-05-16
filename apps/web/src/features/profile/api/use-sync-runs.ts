import { useQuery } from '@tanstack/react-query';

import { syncApi } from '@/lib/api/client';

import { profileQueryKeys } from './profile-query-keys';

export function useSyncRuns(steamId: string, limit = 8) {
  return useQuery({
    queryKey: profileQueryKeys.syncRuns(steamId, limit),
    queryFn: () => syncApi.listSyncRuns({ steamId, limit }),
    refetchInterval: 3_000,
  });
}
