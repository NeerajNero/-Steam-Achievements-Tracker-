import {
  type QueuedSyncResponseDto,
  type SyncRequestDtoScopeEnum,
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

  return useMutation<QueuedSyncResponseDto, Error, EnqueueSyncInput>({
    mutationFn: ({ scope, appIds }) =>
      syncApi.enqueueProfileSync({
        steamId,
        syncRequestDto: {
          scope,
          appIds: appIds === undefined || appIds.length === 0 ? undefined : appIds,
        },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: profileQueryKeys.profile(steamId),
        }),
        queryClient.invalidateQueries({
          queryKey: profileQueryKeys.syncRuns(steamId, 8),
        }),
      ]);
    },
  });
}
