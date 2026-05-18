import type { CreateGameTargetDto } from '@steam-achievement/client-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys';
import { targetsApi } from '@/lib/api/client';

import { targetQueryKeys } from './target-query-keys';

export function useCreateGameTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (createGameTargetDto: CreateGameTargetDto) =>
      targetsApi.createGameTarget({ createGameTargetDto }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: targetQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.me() }),
      ]);
    },
  });
}
