import { useQuery } from '@tanstack/react-query';

import { showcaseApi } from '@/lib/api/client';

import { showcaseQueryKeys } from './showcase-query-keys';

export function useProfileShowcase(steamId: string) {
  return useQuery({
    queryKey: showcaseQueryKeys.profile(steamId),
    queryFn: () => showcaseApi.listProfileShowcase({ steamId }),
    enabled: steamId.length > 0,
  });
}
