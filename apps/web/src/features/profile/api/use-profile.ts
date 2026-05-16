import { useQuery } from '@tanstack/react-query';

import { profilesApi } from '@/lib/api/client';

import { profileQueryKeys } from './profile-query-keys';

export function useProfile(steamId: string) {
  return useQuery({
    queryKey: profileQueryKeys.detail(steamId),
    queryFn: () => profilesApi.getProfile({ steamId }),
  });
}
