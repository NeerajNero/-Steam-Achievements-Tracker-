import { Module } from '@nestjs/common';

import { DatabaseModule } from './db/database.module';
import { AccountModule } from './modules/account/account.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { GamesModule } from './modules/games/games.module';
import { GuidesModule } from './modules/guides/guides.module';
import { HealthModule } from './modules/health/health.module';
import { LeaderboardsModule } from './modules/leaderboards/leaderboards.module';
import { OperationsModule } from './modules/operations/operations.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { PublicProfilesModule } from './modules/public-profiles/public-profiles.module';
import { AuthModule } from './modules/auth/auth.module';
import { SteamModule } from './modules/steam/steam.module';
import { SnapshotsModule } from './modules/snapshots/snapshots.module';
import { SyncModule } from './modules/sync/sync.module';

@Module({
  imports: [
    DatabaseModule,
    SteamModule,
    ProfilesModule,
    GamesModule,
    GuidesModule,
    AchievementsModule,
    SnapshotsModule,
    LeaderboardsModule,
    SyncModule,
    HealthModule,
    OperationsModule,
    AuthModule,
    AccountModule,
    PublicProfilesModule,
  ],
})
export class AppModule {}
