import { useMutation, useQueryClient } from '@tanstack/react-query';

import { communityApi } from '@/lib/api/client';

import { communityQueryKeys } from './community-query-keys';

export function useDeleteGuideComment(guideId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) =>
      communityApi.deleteGuideComment({ guideId, commentId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: communityQueryKeys.guideComments(guideId),
      });
    },
  });
}
