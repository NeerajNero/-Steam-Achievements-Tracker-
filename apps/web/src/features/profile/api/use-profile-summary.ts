import { useQuery } from '@tanstack/react-query';

import { profilesApi } from '@/lib/api/client';

import { profileQueryKeys } from './profile-query-keys';

export function useProfileSummary(steamId: string) {
  return useQuery({
    queryKey: profileQueryKeys.summary(steamId),
    queryFn: () => profilesApi.getProfileSummary({ steamId }),
  });
}
