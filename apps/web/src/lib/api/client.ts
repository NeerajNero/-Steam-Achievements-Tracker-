import {
  AchievementsApi,
  Configuration,
  GamesApi,
  HealthApi,
  ProfilesApi,
  SyncApi,
} from '@steam-achievement/client-sdk';

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') ??
  'http://localhost:3000';

const sdkConfiguration = new Configuration({
  basePath: apiBaseUrl,
});

export const profilesApi = new ProfilesApi(sdkConfiguration);
export const gamesApi = new GamesApi(sdkConfiguration);
export const achievementsApi = new AchievementsApi(sdkConfiguration);
export const syncApi = new SyncApi(sdkConfiguration);
export const healthApi = new HealthApi(sdkConfiguration);

export { apiBaseUrl };
