import { useQuery } from '@tanstack/react-query';

import { sessionsApi } from '@/lib/api/client';

import { sessionQueryKeys, type GlobalSessionsQueryOptions } from './session-query-keys';

export function useGlobalSessions(options: GlobalSessionsQueryOptions = {}) {
  return useQuery({
    queryKey: sessionQueryKeys.globalList(options),
    queryFn: () => sessionsApi.listGlobalSessions(options),
  });
}
