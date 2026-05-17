import type { CreateGuideSectionDto } from '@steam-achievement/client-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { guidesApi } from '@/lib/api/client';

import { guideQueryKeys } from './guide-query-keys';

export function useCreateGuideSection(guideId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (createGuideSectionDto: CreateGuideSectionDto) =>
      guidesApi.createGuideSection({ guideId, createGuideSectionDto }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: guideQueryKeys.all });
    },
  });
}
