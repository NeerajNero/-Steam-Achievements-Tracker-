export interface ProfileSnapshotsQueryOptions {
  limit?: number;
  offset?: number;
}

export const snapshotQueryKeys = {
  all: ['snapshots'] as const,
  profile: (steamId: string, options: ProfileSnapshotsQueryOptions = {}) =>
    [...snapshotQueryKeys.all, 'profile', steamId, options] as const,
};
