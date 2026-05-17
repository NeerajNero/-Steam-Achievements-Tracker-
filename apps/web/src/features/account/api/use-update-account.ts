import type { UpdateAccountDto } from '@steam-achievement/client-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authQueryKeys } from '@/features/auth/api/auth-query-keys';
import { accountApi } from '@/lib/api/client';

import { accountQueryKeys } from './account-query-keys';

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updateAccountDto: UpdateAccountDto) =>
      accountApi.updateAccountMe({ updateAccountDto }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: authQueryKeys.me() }),
      ]);
    },
  });
}
