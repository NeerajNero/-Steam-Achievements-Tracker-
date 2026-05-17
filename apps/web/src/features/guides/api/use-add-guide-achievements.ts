import type { AddGuideAchievementsDto } from '@steam-achievement/client-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { guidesApi } from '@/lib/api/client';

import { guideQueryKeys } from './guide-query-keys';

export function useAddGuideAchievements(guideId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addGuideAchievementsDto: AddGuideAchievementsDto) =>
      guidesApi.addGuideAchievements({ guideId, addGuideAchievementsDto }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: guideQueryKeys.all });
    },
  });
}
