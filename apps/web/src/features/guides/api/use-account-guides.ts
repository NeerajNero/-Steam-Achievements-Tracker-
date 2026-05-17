import { ResponseError, type AccountGuidesResponseDto } from '@steam-achievement/client-sdk';
import { useQuery } from '@tanstack/react-query';

import { guidesApi } from '@/lib/api/client';

import { guideQueryKeys } from './guide-query-keys';

export function useAccountGuides() {
  return useQuery<AccountGuidesResponseDto | null>({
    queryKey: guideQueryKeys.account(),
    queryFn: async () => {
      try {
        return await guidesApi.listAccountGuides();
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
