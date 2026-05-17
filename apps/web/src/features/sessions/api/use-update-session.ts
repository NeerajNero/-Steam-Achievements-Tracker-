import type { UpdateGamingSessionDto } from '@steam-achievement/client-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { sessionsApi } from '@/lib/api/client';

import { sessionQueryKeys } from './session-query-keys';

export function useUpdateSession(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updateGamingSessionDto: UpdateGamingSessionDto) =>
      sessionsApi.updateSession({ sessionId, updateGamingSessionDto }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: sessionQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: sessionQueryKeys.detail(sessionId),
        }),
      ]);
    },
  });
}
