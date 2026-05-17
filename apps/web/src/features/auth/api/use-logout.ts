import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authApi } from '@/lib/api/client';
import { profileQueryKeys } from '@/features/profile/api/profile-query-keys';

import { authQueryKeys } from './auth-query-keys';

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: authQueryKeys.me() }),
        queryClient.invalidateQueries({ queryKey: profileQueryKeys.all }),
      ]);
    },
  });
}
