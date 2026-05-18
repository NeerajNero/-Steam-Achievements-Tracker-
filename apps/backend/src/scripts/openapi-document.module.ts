import { Module } from '@nestjs/common';

import { AccountController } from '../modules/account/account.controller';
import { AccountService } from '../modules/account/account.service';
import { ActivityController } from '../modules/activity/activity.controller';
import { ActivityService } from '../modules/activity/activity.service';
import { BadgesController } from '../modules/badges/badges.controller';
import { BadgesService } from '../modules/badges/badges.service';
import { AchievementsController } from '../modules/achievements/achievements.controller';
import { AchievementsService } from '../modules/achievements/achievements.service';
import { GamesController } from '../modules/games/games.controller';
import { GamesService } from '../modules/games/games.service';
import { GlobalGamesController } from '../modules/games/global-games.controller';
import { CommunityController } from '../modules/community/community.controller';
import { CommunityService } from '../modules/community/community.service';
import { DashboardController } from '../modules/dashboard/dashboard.controller';
import { DashboardService } from '../modules/dashboard/dashboard.service';
import { ReportsController } from '../modules/community/reports.controller';
import { GamingSessionsController } from '../modules/gaming-sessions/gaming-sessions.controller';
import { GamingSessionsService } from '../modules/gaming-sessions/gaming-sessions.service';
import { GuidesController } from '../modules/guides/guides.controller';
import { GuidesService } from '../modules/guides/guides.service';
import { HealthController } from '../modules/health/health.controller';
import { LeaderboardsController } from '../modules/leaderboards/leaderboards.controller';
import { LeaderboardsService } from '../modules/leaderboards/leaderboards.service';
import { MilestonesController } from '../modules/milestones/milestones.controller';
import { MilestonesService } from '../modules/milestones/milestones.service';
import { AuthCookieService } from '../modules/auth/auth-cookie.service';
import { AuthController } from '../modules/auth/auth.controller';
import { AuthService } from '../modules/auth/auth.service';
import { ProfilesController } from '../modules/profiles/profiles.controller';
import { ProfilesService } from '../modules/profiles/profiles.service';
import { PublicProfilesController } from '../modules/public-profiles/public-profiles.controller';
import { PublicProfilesService } from '../modules/public-profiles/public-profiles.service';
import { ShowcaseController } from '../modules/showcase/showcase.controller';
import { ShowcaseService } from '../modules/showcase/showcase.service';
import { SnapshotsController } from '../modules/snapshots/snapshots.controller';
import { SnapshotsService } from '../modules/snapshots/snapshots.service';
import { SyncController } from '../modules/sync/sync.controller';
import { SyncService } from '../modules/sync/sync.service';
import { TargetsController } from '../modules/targets/targets.controller';
import { TargetsService } from '../modules/targets/targets.service';
import { SessionAuthGuard } from '../modules/auth/session-auth.guard';
import { OptionalSessionAuthGuard } from '../modules/auth/optional-session-auth.guard';

const serviceStub = {};

@Module({
  controllers: [
    HealthController,
    ActivityController,
    BadgesController,
    ProfilesController,
    GlobalGamesController,
    CommunityController,
    ReportsController,
    DashboardController,
    TargetsController,
    GamingSessionsController,
    GuidesController,
    GamesController,
    AchievementsController,
    SnapshotsController,
    MilestonesController,
    LeaderboardsController,
    SyncController,
    AuthController,
    AccountController,
    PublicProfilesController,
    ShowcaseController,
  ],
  providers: [
    { provide: ProfilesService, useValue: serviceStub },
    { provide: ActivityService, useValue: serviceStub },
    { provide: BadgesService, useValue: serviceStub },
    { provide: GamesService, useValue: serviceStub },
    { provide: CommunityService, useValue: serviceStub },
    { provide: DashboardService, useValue: serviceStub },
    { provide: TargetsService, useValue: serviceStub },
    { provide: GamingSessionsService, useValue: serviceStub },
    { provide: GuidesService, useValue: serviceStub },
    { provide: AchievementsService, useValue: serviceStub },
    { provide: SnapshotsService, useValue: serviceStub },
    { provide: MilestonesService, useValue: serviceStub },
    { provide: LeaderboardsService, useValue: serviceStub },
    { provide: SyncService, useValue: serviceStub },
    { provide: AuthService, useValue: serviceStub },
    { provide: AuthCookieService, useValue: serviceStub },
    { provide: AccountService, useValue: serviceStub },
    { provide: PublicProfilesService, useValue: serviceStub },
    { provide: ShowcaseService, useValue: serviceStub },
    { provide: SessionAuthGuard, useValue: serviceStub },
    { provide: OptionalSessionAuthGuard, useValue: serviceStub },
  ],
})
export class OpenApiDocumentModule {}
