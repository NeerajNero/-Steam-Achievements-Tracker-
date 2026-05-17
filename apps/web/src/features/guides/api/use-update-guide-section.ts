import type { UpdateGuideSectionDto } from '@steam-achievement/client-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { guidesApi } from '@/lib/api/client';

import { guideQueryKeys } from './guide-query-keys';

export function useUpdateGuideSection(guideId: string, sectionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updateGuideSectionDto: UpdateGuideSectionDto) =>
      guidesApi.updateGuideSection({
        guideId,
        sectionId,
        updateGuideSectionDto,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: guideQueryKeys.all });
    },
  });
}
