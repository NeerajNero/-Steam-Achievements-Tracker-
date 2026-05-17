export const publicProfileQueryKeys = {
  all: ['public-profiles'] as const,
  bySlug: (slug: string) => [...publicProfileQueryKeys.all, slug] as const,
} as const;
