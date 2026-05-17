import { useQuery } from '@tanstack/react-query';

import { badgesApi } from '@/lib/api/client';

import { badgeQueryKeys } from './badge-query-keys';

export function useProfileBadges(steamId: string) {
  return useQuery({
    queryKey: badgeQueryKeys.profile(steamId),
    queryFn: () => badgesApi.listProfileBadges({ steamId }),
    enabled: steamId.length > 0,
  });
}
