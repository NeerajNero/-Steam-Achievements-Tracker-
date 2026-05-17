import { type AuthMeResponseDto, ResponseError } from '@steam-achievement/client-sdk';
import { useQuery } from '@tanstack/react-query';

import { authApi } from '@/lib/api/client';

import { authQueryKeys } from './auth-query-keys';

export function useCurrentUser() {
  return useQuery<AuthMeResponseDto | null>({
    queryKey: authQueryKeys.me(),
    queryFn: async () => {
      try {
        return await authApi.getCurrentUser();
      } catch (error: unknown) {
        if (error instanceof ResponseError && error.response.status === 401) {
          return null;
        }

        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
