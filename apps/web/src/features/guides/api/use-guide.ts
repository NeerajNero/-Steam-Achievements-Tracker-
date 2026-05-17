import { useQuery } from '@tanstack/react-query';

import { guidesApi } from '@/lib/api/client';

import { guideQueryKeys } from './guide-query-keys';

export function useGuide(steamAppId: number, slug: string) {
  return useQuery({
    enabled: Number.isInteger(steamAppId) && steamAppId > 0 && slug.length > 0,
    queryKey: guideQueryKeys.detail(steamAppId, slug),
    queryFn: () => guidesApi.getGameGuide({ steamAppId, slug }),
  });
}
