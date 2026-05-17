import { useQuery } from '@tanstack/react-query';

import { sessionsApi } from '@/lib/api/client';

import { sessionQueryKeys } from './session-query-keys';

export function useSession(sessionId: string) {
  return useQuery({
    enabled: sessionId.length > 0,
    queryKey: sessionQueryKeys.detail(sessionId),
    queryFn: () => sessionsApi.getSession({ sessionId }),
  });
}
