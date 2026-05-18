import { ResponseError, type AccountTargetsResponseDto } from '@steam-achievement/client-sdk';
import { useQuery } from '@tanstack/react-query';

import { targetsApi } from '@/lib/api/client';

import { type AccountTargetsQueryOptions, targetQueryKeys } from './target-query-keys';

export function useAccountTargets(
  options: AccountTargetsQueryOptions = {},
  enabled = true,
) {
  return useQuery<AccountTargetsResponseDto | null>({
    queryKey: targetQueryKeys.list(options),
    queryFn: async () => {
      try {
        return await targetsApi.listAccountTargets(options);
      } catch (error: unknown) {
        if (error instanceof ResponseError && error.response.status === 401) {
          return null;
        }

        throw error;
      }
    },
    enabled,
    retry: false,
    staleTime: 30_000,
  });
}
