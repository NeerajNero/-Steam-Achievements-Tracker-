import type { UpdateAchievementTargetDto } from '@steam-achievement/client-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys';
import { targetsApi } from '@/lib/api/client';

import { targetQueryKeys } from './target-query-keys';

export function useUpdateAchievementTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      targetId,
      updateAchievementTargetDto,
    }: {
      targetId: string;
      updateAchievementTargetDto: UpdateAchievementTargetDto;
    }) =>
      targetsApi.updateAchievementTarget({
        targetId,
        updateAchievementTargetDto,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: targetQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.me() }),
      ]);
    },
  });
}
