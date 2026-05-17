export interface ProfileMilestonesQueryOptions {
  limit?: number;
  offset?: number;
}

export const milestoneQueryKeys = {
  all: ['milestones'] as const,
  profile: (steamId: string, options: ProfileMilestonesQueryOptions = {}) =>
    [...milestoneQueryKeys.all, 'profile', steamId, options] as const,
};
