export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  me: () => [...dashboardQueryKeys.all, 'me'] as const,
} as const;
