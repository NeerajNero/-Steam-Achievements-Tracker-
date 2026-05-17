export const accountQueryKeys = {
  all: ['account'] as const,
  me: () => [...accountQueryKeys.all, 'me'] as const,
  preferences: () => [...accountQueryKeys.all, 'preferences'] as const,
  publicProfile: () => [...accountQueryKeys.all, 'public-profile'] as const,
} as const;
