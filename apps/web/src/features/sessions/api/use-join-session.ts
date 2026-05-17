import { useMutation, useQueryClient } from '@tanstack/react-query';

import { sessionsApi } from '@/lib/api/client';

import { sessionQueryKeys } from './session-query-keys';

export function useJoinSession(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => sessionsApi.joinSession({ sessionId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKeys.all });
    },
  });
}
