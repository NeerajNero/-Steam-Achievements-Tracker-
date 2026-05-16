import { Global, Module } from '@nestjs/common';

import { AchievementsRepository } from './repositories/achievements.repository';
import { AchievementSyncRepository } from './repositories/achievement-sync.repository';
import { GamesRepository } from './repositories/games.repository';
import { ProfileAchievementsRepository } from './repositories/profile-achievements.repository';
import { ProfileGamesRepository } from './repositories/profile-games.repository';
import { SteamProfilesRepository } from './repositories/steam-profiles.repository';
import { SyncRunsRepository } from './repositories/sync-runs.repository';
import { AchievementsDataService } from './services/achievements-data.service';
import { AchievementSyncDataService } from './services/achievement-sync-data.service';
import { GamesDataService } from './services/games-data.service';
import { ProfileAchievementsDataService } from './services/profile-achievements-data.service';
import { ProfileGamesDataService } from './services/profile-games-data.service';
import { SteamProfilesDataService } from './services/steam-profiles-data.service';
import { SyncRunsDataService } from './services/sync-runs-data.service';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [
    DatabaseService,
    AchievementSyncRepository,
    SteamProfilesRepository,
    GamesRepository,
    ProfileGamesRepository,
    AchievementsRepository,
    ProfileAchievementsRepository,
    SyncRunsRepository,
    AchievementSyncDataService,
    SteamProfilesDataService,
    GamesDataService,
    ProfileGamesDataService,
    AchievementsDataService,
    ProfileAchievementsDataService,
    SyncRunsDataService,
  ],
  exports: [
    DatabaseService,
    AchievementSyncDataService,
    SteamProfilesDataService,
    GamesDataService,
    ProfileGamesDataService,
    AchievementsDataService,
    ProfileAchievementsDataService,
    SyncRunsDataService,
  ],
})
export class DatabaseModule {}
