import { Module } from '@nestjs/common';

import { DatabaseModule } from './db/database.module';
import { AccountModule } from './modules/account/account.module';
import { ActivityModule } from './modules/activity/activity.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { GamesModule } from './modules/games/games.module';
import { GamingSessionsModule } from './modules/gaming-sessions/gaming-sessions.module';
import { GuidesModule } from './modules/guides/guides.module';
import { HealthModule } from './modules/health/health.module';
import { LeaderboardsModule } from './modules/leaderboards/leaderboards.module';
import { MilestonesModule } from './modules/milestones/milestones.module';
import { OperationsModule } from './modules/operations/operations.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { PublicProfilesModule } from './modules/public-profiles/public-profiles.module';
import { AuthModule } from './modules/auth/auth.module';
import { BadgesModule } from './modules/badges/badges.module';
import { CommunityModule } from './modules/community/community.module';
import { ShowcaseModule } from './modules/showcase/showcase.module';
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
    GamingSessionsModule,
    AchievementsModule,
    SnapshotsModule,
    LeaderboardsModule,
    SyncModule,
    HealthModule,
    OperationsModule,
    AuthModule,
    BadgesModule,
    CommunityModule,
    AccountModule,
    PublicProfilesModule,
    ShowcaseModule,
    ActivityModule,
    MilestonesModule,
  ],
})
export class AppModule {}
