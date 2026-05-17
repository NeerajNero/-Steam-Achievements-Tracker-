import { Module } from '@nestjs/common';

import { AccountController } from '../modules/account/account.controller';
import { AccountService } from '../modules/account/account.service';
import { AchievementsController } from '../modules/achievements/achievements.controller';
import { AchievementsService } from '../modules/achievements/achievements.service';
import { GamesController } from '../modules/games/games.controller';
import { GamesService } from '../modules/games/games.service';
import { GlobalGamesController } from '../modules/games/global-games.controller';
import { GuidesController } from '../modules/guides/guides.controller';
import { GuidesService } from '../modules/guides/guides.service';
import { HealthController } from '../modules/health/health.controller';
import { LeaderboardsController } from '../modules/leaderboards/leaderboards.controller';
import { LeaderboardsService } from '../modules/leaderboards/leaderboards.service';
import { AuthCookieService } from '../modules/auth/auth-cookie.service';
import { AuthController } from '../modules/auth/auth.controller';
import { AuthService } from '../modules/auth/auth.service';
import { ProfilesController } from '../modules/profiles/profiles.controller';
import { ProfilesService } from '../modules/profiles/profiles.service';
import { PublicProfilesController } from '../modules/public-profiles/public-profiles.controller';
import { PublicProfilesService } from '../modules/public-profiles/public-profiles.service';
import { SnapshotsController } from '../modules/snapshots/snapshots.controller';
import { SnapshotsService } from '../modules/snapshots/snapshots.service';
import { SyncController } from '../modules/sync/sync.controller';
import { SyncService } from '../modules/sync/sync.service';
import { SessionAuthGuard } from '../modules/auth/session-auth.guard';

const serviceStub = {};

@Module({
  controllers: [
    HealthController,
    ProfilesController,
    GlobalGamesController,
    GuidesController,
    GamesController,
    AchievementsController,
    SnapshotsController,
    LeaderboardsController,
    SyncController,
    AuthController,
    AccountController,
    PublicProfilesController,
  ],
  providers: [
    { provide: ProfilesService, useValue: serviceStub },
    { provide: GamesService, useValue: serviceStub },
    { provide: GuidesService, useValue: serviceStub },
    { provide: AchievementsService, useValue: serviceStub },
    { provide: SnapshotsService, useValue: serviceStub },
    { provide: LeaderboardsService, useValue: serviceStub },
    { provide: SyncService, useValue: serviceStub },
    { provide: AuthService, useValue: serviceStub },
    { provide: AuthCookieService, useValue: serviceStub },
    { provide: AccountService, useValue: serviceStub },
    { provide: PublicProfilesService, useValue: serviceStub },
    { provide: SessionAuthGuard, useValue: serviceStub },
  ],
})
export class OpenApiDocumentModule {}
