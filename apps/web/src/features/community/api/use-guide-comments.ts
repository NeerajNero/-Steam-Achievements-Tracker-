import { useQuery } from '@tanstack/react-query';

import { communityApi } from '@/lib/api/client';

import { communityQueryKeys } from './community-query-keys';

export function useGuideComments(guideId: string) {
  return useQuery({
    enabled: guideId.length > 0,
    queryKey: communityQueryKeys.guideComments(guideId),
    queryFn: () => communityApi.listGuideComments({ guideId }),
  });
}
