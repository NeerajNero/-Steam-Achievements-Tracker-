import { type AccountPublicProfileResponseDto, ResponseError } from '@steam-achievement/client-sdk';
import { useQuery } from '@tanstack/react-query';

import { accountApi } from '@/lib/api/client';

import { accountQueryKeys } from './account-query-keys';

export function usePublicProfileSettings() {
  return useQuery<AccountPublicProfileResponseDto | null>({
    queryKey: accountQueryKeys.publicProfile(),
    queryFn: async () => {
      try {
        return await accountApi.getAccountPublicProfile();
      } catch (error: unknown) {
        if (error instanceof ResponseError && error.response.status === 401) {
          return null;
        }

        throw error;
      }
    },
    retry: false,
  });
}
