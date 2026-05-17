import type { CreateGamingSessionDto } from '@steam-achievement/client-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { sessionsApi } from '@/lib/api/client';

import { sessionQueryKeys } from './session-query-keys';

export function useCreateSession(steamAppId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (createGamingSessionDto: CreateGamingSessionDto) =>
      sessionsApi.createGameSession({ steamAppId, createGamingSessionDto }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: sessionQueryKeys.all }),
      ]);
    },
  });
}
