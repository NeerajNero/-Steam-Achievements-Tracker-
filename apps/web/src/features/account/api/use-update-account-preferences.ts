import type { UpdatePreferencesDto } from '@steam-achievement/client-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accountApi } from '@/lib/api/client';

import { accountQueryKeys } from './account-query-keys';

export function useUpdateAccountPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updatePreferencesDto: UpdatePreferencesDto) =>
      accountApi.updateAccountPreferences({ updatePreferencesDto }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.me() }),
        queryClient.invalidateQueries({
          queryKey: accountQueryKeys.preferences(),
        }),
      ]);
    },
  });
}
