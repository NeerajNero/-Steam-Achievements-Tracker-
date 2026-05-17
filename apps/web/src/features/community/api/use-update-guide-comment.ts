import { useMutation, useQueryClient } from '@tanstack/react-query';

import { communityApi } from '@/lib/api/client';

import { communityQueryKeys } from './community-query-keys';

export function useUpdateGuideComment(guideId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { commentId: string; body: string }) =>
      communityApi.updateGuideComment({
        guideId,
        commentId: input.commentId,
        updateCommentDto: { body: input.body },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: communityQueryKeys.guideComments(guideId),
      });
    },
  });
}
