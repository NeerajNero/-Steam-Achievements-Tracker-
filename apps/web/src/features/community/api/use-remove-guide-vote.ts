import { useMutation, useQueryClient } from '@tanstack/react-query';

import { communityApi } from '@/lib/api/client';

import { communityQueryKeys } from './community-query-keys';

export function useRemoveGuideVote(guideId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => communityApi.removeGuideVote({ guideId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: communityQueryKeys.guideVoteSummary(guideId),
      });
    },
  });
}
