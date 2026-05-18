import {
  ResponseError,
  type CreateAchievementTargetDto,
} from '@steam-achievement/client-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys';
import { targetsApi } from '@/lib/api/client';

import { targetQueryKeys } from './target-query-keys';

export function useCreateAchievementTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (createAchievementTargetDto: CreateAchievementTargetDto) =>
      targetsApi.createAchievementTarget({ createAchievementTargetDto }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: targetQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.me() }),
      ]);
    },
    onError: async (error: unknown) => {
      if (error instanceof ResponseError && error.response.status === 409) {
        await queryClient.invalidateQueries({ queryKey: targetQueryKeys.all });
      }
    },
  });
}
