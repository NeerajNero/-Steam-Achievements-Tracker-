import type { AddSessionAchievementsDto } from '@steam-achievement/client-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { sessionsApi } from '@/lib/api/client';

import { sessionQueryKeys } from './session-query-keys';

export function useAddSessionAchievements(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addSessionAchievementsDto: AddSessionAchievementsDto) =>
      sessionsApi.addSessionAchievements({ sessionId, addSessionAchievementsDto }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: sessionQueryKeys.detail(sessionId),
      });
    },
  });
}
