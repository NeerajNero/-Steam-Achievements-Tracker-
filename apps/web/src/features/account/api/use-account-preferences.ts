import { type AccountPreferencesResponseDto, ResponseError } from '@steam-achievement/client-sdk';
import { useQuery } from '@tanstack/react-query';

import { accountApi } from '@/lib/api/client';

import { accountQueryKeys } from './account-query-keys';

export function useAccountPreferences() {
  return useQuery<AccountPreferencesResponseDto | null>({
    queryKey: accountQueryKeys.preferences(),
    queryFn: async () => {
      try {
        return await accountApi.getAccountPreferences();
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
