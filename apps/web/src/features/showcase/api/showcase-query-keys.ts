export const showcaseQueryKeys = {
  all: ['showcase'] as const,
  account: () => [...showcaseQueryKeys.all, 'account'] as const,
  profile: (steamId: string) =>
    [...showcaseQueryKeys.all, 'profile', steamId] as const,
};
