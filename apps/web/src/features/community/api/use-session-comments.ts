import { useQuery } from '@tanstack/react-query';

import { communityApi } from '@/lib/api/client';

import { communityQueryKeys } from './community-query-keys';

export function useSessionComments(sessionId: string) {
  return useQuery({
    enabled: sessionId.length > 0,
    queryKey: communityQueryKeys.sessionComments(sessionId),
    queryFn: () => communityApi.listSessionComments({ sessionId }),
  });
}
