import { Global, Module } from '@nestjs/common';

import { AchievementsRepository } from './repositories/achievements.repository';
import { AchievementSyncRepository } from './repositories/achievement-sync.repository';
import { AppUsersRepository } from './repositories/app-users.repository';
import { AuthCallbackRepository } from './repositories/auth-callback.repository';
import { GamesRepository } from './repositories/games.repository';
import { GuideAchievementsRepository } from './repositories/guide-achievements.repository';
import { GuideSectionsRepository } from './repositories/guide-sections.repository';
import { GuidesRepository } from './repositories/guides.repository';
import { LeaderboardsRepository } from './repositories/leaderboards.repository';
import { ProfileAchievementsRepository } from './repositories/profile-achievements.repository';
import { ProfileGamesRepository } from './repositories/profile-games.repository';
import { ProfileSnapshotsRepository } from './repositories/profile-snapshots.repository';
import { PublicProfilesRepository } from './repositories/public-profiles.repository';
import { SteamProfilesRepository } from './repositories/steam-profiles.repository';
import { AuthSessionsRepository } from './repositories/auth-sessions.repository';
import { SyncRunsRepository } from './repositories/sync-runs.repository';
import { UserPreferencesRepository } from './repositories/user-preferences.repository';
import { UserSteamAccountsRepository } from './repositories/user-steam-accounts.repository';
import { AchievementsDataService } from './services/achievements-data.service';
import { AchievementSyncDataService } from './services/achievement-sync-data.service';
import { AppUsersDataService } from './services/app-users-data.service';
import { AuthCallbackDataService } from './services/auth-callback-data.service';
import { GamesDataService } from './services/games-data.service';
import { GuideAchievementsDataService } from './services/guide-achievements-data.service';
import { GuideSectionsDataService } from './services/guide-sections-data.service';
import { GuidesDataService } from './services/guides-data.service';
import { LeaderboardsDataService } from './services/leaderboards-data.service';
import { ProfileAchievementsDataService } from './services/profile-achievements-data.service';
import { ProfileGamesDataService } from './services/profile-games-data.service';
import { ProfileSnapshotsDataService } from './services/profile-snapshots-data.service';
import { PublicProfilesDataService } from './services/public-profiles-data.service';
import { AuthSessionsDataService } from './services/auth-sessions-data.service';
import { SteamProfilesDataService } from './services/steam-profiles-data.service';
import { SyncRunsDataService } from './services/sync-runs-data.service';
import { UserPreferencesDataService } from './services/user-preferences-data.service';
import { UserSteamAccountsDataService } from './services/user-steam-accounts-data.service';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [
    DatabaseService,
    AchievementSyncRepository,
    AuthCallbackRepository,
    AuthSessionsRepository,
    SteamProfilesRepository,
    AppUsersRepository,
    UserSteamAccountsRepository,
    UserPreferencesRepository,
    PublicProfilesRepository,
    GamesRepository,
    GuidesRepository,
    GuideSectionsRepository,
    GuideAchievementsRepository,
    LeaderboardsRepository,
    ProfileGamesRepository,
    ProfileSnapshotsRepository,
    AchievementsRepository,
    ProfileAchievementsRepository,
    SyncRunsRepository,
    AchievementSyncDataService,
    AuthCallbackDataService,
    AppUsersDataService,
    SteamProfilesDataService,
    UserSteamAccountsDataService,
    UserPreferencesDataService,
    PublicProfilesDataService,
    AuthSessionsDataService,
    GamesDataService,
    GuidesDataService,
    GuideSectionsDataService,
    GuideAchievementsDataService,
    LeaderboardsDataService,
    ProfileGamesDataService,
    ProfileSnapshotsDataService,
    AchievementsDataService,
    ProfileAchievementsDataService,
    SyncRunsDataService,
  ],
  exports: [
    DatabaseService,
    AchievementSyncDataService,
    AuthCallbackDataService,
    AppUsersDataService,
    SteamProfilesDataService,
    GamesDataService,
    GuidesDataService,
    GuideSectionsDataService,
    GuideAchievementsDataService,
    LeaderboardsDataService,
    ProfileGamesDataService,
    ProfileSnapshotsDataService,
    AchievementsDataService,
    ProfileAchievementsDataService,
    SyncRunsDataService,
    UserSteamAccountsDataService,
    UserPreferencesDataService,
    PublicProfilesDataService,
    AuthSessionsDataService,
  ],
})
export class DatabaseModule {}
