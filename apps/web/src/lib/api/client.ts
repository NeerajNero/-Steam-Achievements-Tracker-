import {
  AccountApi,
  AuthApi,
  AchievementsApi,
  Configuration,
  GamesApi,
  GuidesApi,
  HealthApi,
  LeaderboardsApi,
  ProfilesApi,
  SyncApi,
  PublicProfilesApi,
  SnapshotsApi,
} from '@steam-achievement/client-sdk';

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') ??
  'http://localhost:3000';

const sdkConfiguration = new Configuration({
  basePath: apiBaseUrl,
  credentials: 'include',
});

export const profilesApi = new ProfilesApi(sdkConfiguration);
export const gamesApi = new GamesApi(sdkConfiguration);
export const guidesApi = new GuidesApi(sdkConfiguration);
export const achievementsApi = new AchievementsApi(sdkConfiguration);
export const syncApi = new SyncApi(sdkConfiguration);
export const healthApi = new HealthApi(sdkConfiguration);
export const authApi = new AuthApi(sdkConfiguration);
export const accountApi = new AccountApi(sdkConfiguration);
export const publicProfilesApi = new PublicProfilesApi(sdkConfiguration);
export const leaderboardsApi = new LeaderboardsApi(sdkConfiguration);
export const snapshotsApi = new SnapshotsApi(sdkConfiguration);

export { apiBaseUrl };
