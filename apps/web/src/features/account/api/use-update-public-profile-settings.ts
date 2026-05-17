import type { UpdatePublicProfileSettingsDto } from '@steam-achievement/client-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accountApi } from '@/lib/api/client';

import { accountQueryKeys } from './account-query-keys';

export function useUpdatePublicProfileSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updatePublicProfileSettingsDto: UpdatePublicProfileSettingsDto) =>
      accountApi.updateAccountPublicProfile({ updatePublicProfileSettingsDto }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.me() }),
        queryClient.invalidateQueries({
          queryKey: accountQueryKeys.publicProfile(),
        }),
      ]);
    },
  });
}
