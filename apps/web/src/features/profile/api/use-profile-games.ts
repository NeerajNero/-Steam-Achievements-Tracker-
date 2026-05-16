import { useQuery } from '@tanstack/react-query';

import { gamesApi } from '@/lib/api/client';

import type { ProfileGamesQueryOptions } from './profile-query-keys';
import { profileQueryKeys } from './profile-query-keys';

export function useProfileGames(
  steamId: string,
  options: ProfileGamesQueryOptions = {},
) {
  return useQuery({
    queryKey: profileQueryKeys.games(steamId, options),
    queryFn: () => gamesApi.listProfileGames({ steamId, ...options }),
  });
}
