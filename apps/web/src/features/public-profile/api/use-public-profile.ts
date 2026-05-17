import { type PublicProfileResponseDto, ResponseError } from '@steam-achievement/client-sdk';
import { useQuery } from '@tanstack/react-query';

import { publicProfilesApi } from '@/lib/api/client';

import { publicProfileQueryKeys } from './public-profile-query-keys';

export function usePublicProfile(slug: string) {
  return useQuery<PublicProfileResponseDto | null>({
    queryKey: publicProfileQueryKeys.bySlug(slug),
    queryFn: async () => {
      try {
        return await publicProfilesApi.getPublicProfileBySlug({ slug });
      } catch (error: unknown) {
        if (error instanceof ResponseError && error.response.status === 404) {
          return null;
        }

        throw error;
      }
    },
    retry: false,
  });
}
