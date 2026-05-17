import { useQuery } from '@tanstack/react-query';

import { badgesApi } from '@/lib/api/client';

import { badgeQueryKeys } from './badge-query-keys';

export function useBadgeDefinitions() {
  return useQuery({
    queryKey: badgeQueryKeys.definitions(),
    queryFn: () => badgesApi.listBadges(),
  });
}
