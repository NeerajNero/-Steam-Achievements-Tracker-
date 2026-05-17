import { useQuery } from '@tanstack/react-query';

import { snapshotsApi } from '@/lib/api/client';

import {
  snapshotQueryKeys,
  type ProfileSnapshotsQueryOptions,
} from './snapshot-query-keys';

export function useProfileSnapshots(
  steamId: string,
  options: ProfileSnapshotsQueryOptions = {},
) {
  return useQuery({
    queryKey: snapshotQueryKeys.profile(steamId, options),
    queryFn: () => snapshotsApi.listProfileSnapshots({ steamId, ...options }),
  });
}
