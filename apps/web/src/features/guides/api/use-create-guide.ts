import type { CreateGuideDto } from '@steam-achievement/client-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { guidesApi } from '@/lib/api/client';

import { guideQueryKeys } from './guide-query-keys';

export function useCreateGuide(steamAppId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (createGuideDto: CreateGuideDto) =>
      guidesApi.createGameGuide({ steamAppId, createGuideDto }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: guideQueryKeys.gameLists() }),
        queryClient.invalidateQueries({ queryKey: guideQueryKeys.account() }),
      ]);
    },
  });
}
