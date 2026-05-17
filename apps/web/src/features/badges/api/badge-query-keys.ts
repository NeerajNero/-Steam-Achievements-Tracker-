export const badgeQueryKeys = {
  all: ['badges'] as const,
  definitions: () => [...badgeQueryKeys.all, 'definitions'] as const,
  profile: (steamId: string) =>
    [...badgeQueryKeys.all, 'profile', steamId] as const,
};
