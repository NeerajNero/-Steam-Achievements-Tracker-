import {
  type QueuedSyncResponseDto,
  type SyncRequestDtoScopeEnum,
  SyncRequestDtoScopeEnum as SyncRequestScope,
} from '@steam-achievement/client-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { syncApi } from '@/lib/api/client';

import { profileQueryKeys } from './profile-query-keys';

export interface EnqueueSyncInput {
  scope: SyncRequestDtoScopeEnum;
  appIds?: number[];
}

export function useEnqueueSync(steamId: string) {
  const queryClient = useQueryClient();
  const steamSyncQueries = profileQueryKeys.syncRunsPrefix(steamId);
  const profileDetailQuery = profileQueryKeys.detail(steamId);
  const profileSummaryQuery = profileQueryKeys.summary(steamId);

  return useMutation<QueuedSyncResponseDto, Error, EnqueueSyncInput>({
    mutationFn: ({ scope, appIds }) =>
      syncApi.enqueueProfileSync({
        steamId,
        syncRequestDto: {
          scope,
          appIds: appIds === undefined || appIds.length === 0 ? undefined : appIds,
        },
      }),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: profileQueryKeys.profile(steamId),
        exact: false,
      });

      if (variables.scope === SyncRequestScope.Profile) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: profileDetailQuery }),
          queryClient.invalidateQueries({ queryKey: profileSummaryQuery }),
          queryClient.invalidateQueries({ queryKey: steamSyncQueries, exact: false }),
        ]);
        return;
      }

      if (variables.scope === SyncRequestScope.Games) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: profileQueryKeys.gamesPrefix(steamId),
            exact: false,
          }),
          queryClient.invalidateQueries({ queryKey: profileDetailQuery }),
          queryClient.invalidateQueries({ queryKey: profileSummaryQuery }),
          queryClient.invalidateQueries({
            queryKey: steamSyncQueries,
            exact: false,
          }),
        ]);
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: profileQueryKeys.nearestCompletionsPrefix(steamId),
          exact: false,
        }),
        queryClient.invalidateQueries({
          queryKey: profileQueryKeys.rarestAchievementsPrefix(steamId),
          exact: false,
        }),
        queryClient.invalidateQueries({
          queryKey: profileQueryKeys.gamesPrefix(steamId),
          exact: false,
        }),
        queryClient.invalidateQueries({
          queryKey: profileDetailQuery,
        }),
        queryClient.invalidateQueries({
          queryKey: profileSummaryQuery,
        }),
        queryClient.invalidateQueries({
          queryKey: steamSyncQueries,
          exact: false,
        }),
      ]);
    },
  });
}
