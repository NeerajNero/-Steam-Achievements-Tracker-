import type { UpsertGuideVoteDtoValueEnum } from '@steam-achievement/client-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { communityApi } from '@/lib/api/client';

import { communityQueryKeys } from './community-query-keys';

export function useUpsertGuideVote(guideId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (value: UpsertGuideVoteDtoValueEnum) =>
      communityApi.upsertGuideVote({
        guideId,
        upsertGuideVoteDto: { value },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: communityQueryKeys.guideVoteSummary(guideId),
      });
    },
  });
}
