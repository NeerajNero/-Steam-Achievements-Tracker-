import { type MyDashboardResponseDto, ResponseError } from '@steam-achievement/client-sdk';
import { useQuery } from '@tanstack/react-query';

import { dashboardApi } from '@/lib/api/client';

import { dashboardQueryKeys } from './dashboard-query-keys';

export function useMyDashboard(enabled: boolean) {
  return useQuery<MyDashboardResponseDto | null>({
    queryKey: dashboardQueryKeys.me(),
    queryFn: async () => {
      try {
        return await dashboardApi.getMyDashboard();
      } catch (error: unknown) {
        if (error instanceof ResponseError && error.response.status === 401) {
          return null;
        }

        throw error;
      }
    },
    enabled,
    retry: false,
    staleTime: 60_000,
  });
}
