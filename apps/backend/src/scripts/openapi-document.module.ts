import { Module } from '@nestjs/common';

import { AchievementsController } from '../modules/achievements/achievements.controller';
import { AchievementsService } from '../modules/achievements/achievements.service';
import { GamesController } from '../modules/games/games.controller';
import { GamesService } from '../modules/games/games.service';
import { HealthController } from '../modules/health/health.controller';
import { ProfilesController } from '../modules/profiles/profiles.controller';
import { ProfilesService } from '../modules/profiles/profiles.service';
import { SyncController } from '../modules/sync/sync.controller';
import { SyncService } from '../modules/sync/sync.service';

const serviceStub = {};

@Module({
  controllers: [
    HealthController,
    ProfilesController,
    GamesController,
    AchievementsController,
    SyncController,
  ],
  providers: [
    { provide: ProfilesService, useValue: serviceStub },
    { provide: GamesService, useValue: serviceStub },
    { provide: AchievementsService, useValue: serviceStub },
    { provide: SyncService, useValue: serviceStub },
  ],
})
export class OpenApiDocumentModule {}
