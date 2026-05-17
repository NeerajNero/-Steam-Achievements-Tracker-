import type { UpdateGuideDto } from '@steam-achievement/client-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { guidesApi } from '@/lib/api/client';

import { guideQueryKeys } from './guide-query-keys';

export function useUpdateGuide(guideId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updateGuideDto: UpdateGuideDto) =>
      guidesApi.updateGuide({ guideId, updateGuideDto }),
    onSuccess: async (guide) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: guideQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: guideQueryKeys.detail(guide.steamAppId, guide.slug),
        }),
      ]);
    },
  });
}
