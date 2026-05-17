import { type AccountResponseDto, ResponseError } from '@steam-achievement/client-sdk';
import { useQuery } from '@tanstack/react-query';

import { accountApi } from '@/lib/api/client';

import { accountQueryKeys } from './account-query-keys';

export function useAccountMe() {
  return useQuery<AccountResponseDto | null>({
    queryKey: accountQueryKeys.me(),
    queryFn: async () => {
      try {
        return await accountApi.getAccountMe();
      } catch (error: unknown) {
        if (error instanceof ResponseError && error.response.status === 401) {
          return null;
        }

        throw error;
      }
    },
    retry: false,
    staleTime: 2 * 60 * 1000,
  });
}
