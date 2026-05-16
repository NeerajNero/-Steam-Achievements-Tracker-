import { useQuery } from '@tanstack/react-query';

import { gamesApi } from '@/lib/api/client';

import { profileQueryKeys } from './profile-query-keys';

export function useProfileGame(steamId: string, steamAppId: number) {
  return useQuery({
    queryKey: profileQueryKeys.game(steamId, steamAppId),
    queryFn: () => gamesApi.getProfileGame({ steamId, steamAppId }),
  });
}
