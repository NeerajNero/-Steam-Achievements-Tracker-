import { useMutation, useQueryClient } from '@tanstack/react-query';

import { communityApi } from '@/lib/api/client';

import { communityQueryKeys } from './community-query-keys';

export function useCreateSessionComment(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) =>
      communityApi.createSessionComment({
        sessionId,
        createCommentDto: { body },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: communityQueryKeys.sessionComments(sessionId),
      });
    },
  });
}
