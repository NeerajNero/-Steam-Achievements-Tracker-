import { useMutation, useQueryClient } from '@tanstack/react-query';

import { communityApi } from '@/lib/api/client';

import { communityQueryKeys } from './community-query-keys';

export function useCreateGuideComment(guideId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) =>
      communityApi.createGuideComment({
        guideId,
        createCommentDto: { body },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: communityQueryKeys.guideComments(guideId),
      });
    },
  });
}
