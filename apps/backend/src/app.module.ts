import { Module } from '@nestjs/common';

import { DatabaseModule } from './db/database.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { GamesModule } from './modules/games/games.module';
import { HealthModule } from './modules/health/health.module';
import { OperationsModule } from './modules/operations/operations.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { AuthModule } from './modules/auth/auth.module';
import { SteamModule } from './modules/steam/steam.module';
import { SyncModule } from './modules/sync/sync.module';

@Module({
  imports: [
    DatabaseModule,
    SteamModule,
    ProfilesModule,
    GamesModule,
    AchievementsModule,
    SyncModule,
    HealthModule,
    OperationsModule,
    AuthModule,
  ],
})
export class AppModule {}
