import type { UpdateAccountShowcaseDto } from '@steam-achievement/client-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { showcaseApi } from '@/lib/api/client';

import { showcaseQueryKeys } from './showcase-query-keys';

export function useUpdateAccountShowcase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updateAccountShowcaseDto: UpdateAccountShowcaseDto) =>
      showcaseApi.updateAccountShowcase({ updateAccountShowcaseDto }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: showcaseQueryKeys.account() });
      void queryClient.invalidateQueries({
        queryKey: showcaseQueryKeys.profile(data.steamId),
      });
    },
  });
}
