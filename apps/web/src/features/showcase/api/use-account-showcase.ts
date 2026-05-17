import { useQuery } from '@tanstack/react-query';

import { showcaseApi } from '@/lib/api/client';

import { showcaseQueryKeys } from './showcase-query-keys';

export function useAccountShowcase(enabled = true) {
  return useQuery({
    queryKey: showcaseQueryKeys.account(),
    queryFn: () => showcaseApi.getAccountShowcase(),
    enabled,
  });
}
