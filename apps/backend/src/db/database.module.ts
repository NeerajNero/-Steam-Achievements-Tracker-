import { Global, Module } from '@nestjs/common';

import { AchievementsRepository } from './repositories/achievements.repository';
import { AchievementSyncRepository } from './repositories/achievement-sync.repository';
import { ActivityEventsRepository } from './repositories/activity-events.repository';
import { AppUsersRepository } from './repositories/app-users.repository';
import { AuthCallbackRepository } from './repositories/auth-callback.repository';
import { ContentReportsRepository } from './repositories/content-reports.repository';
import { DashboardRepository } from './repositories/dashboard.repository';
import { BadgesRepository } from './repositories/badges.repository';
import { GamesRepository } from './repositories/games.repository';
import { GuideCommentsRepository } from './repositories/guide-comments.repository';
import { GuideAchievementsRepository } from './repositories/guide-achievements.repository';
import { GuideSectionsRepository } from './repositories/guide-sections.repository';
import { GuideVotesRepository } from './repositories/guide-votes.repository';
import { GuidesRepository } from './repositories/guides.repository';
import { GamingSessionAchievementsRepository } from './repositories/gaming-session-achievements.repository';
import { GamingSessionParticipantsRepository } from './repositories/gaming-session-participants.repository';
import { GamingSessionsRepository } from './repositories/gaming-sessions.repository';
import { SessionCommentsRepository } from './repositories/session-comments.repository';
import { LeaderboardsRepository } from './repositories/leaderboards.repository';
import { ProfileAchievementsRepository } from './repositories/profile-achievements.repository';
import { ProfileBadgesRepository } from './repositories/profile-badges.repository';
import { ProfileGamesRepository } from './repositories/profile-games.repository';
import { ProfileMilestonesRepository } from './repositories/profile-milestones.repository';
import { ProfileSnapshotsRepository } from './repositories/profile-snapshots.repository';
import { ProfileShowcaseItemsRepository } from './repositories/profile-showcase-items.repository';
import { PublicProfilesRepository } from './repositories/public-profiles.repository';
import { SteamProfilesRepository } from './repositories/steam-profiles.repository';
import { TargetsRepository } from './repositories/targets.repository';
import { AuthSessionsRepository } from './repositories/auth-sessions.repository';
import { SyncRunsRepository } from './repositories/sync-runs.repository';
import { UserPreferencesRepository } from './repositories/user-preferences.repository';
import { UserSteamAccountsRepository } from './repositories/user-steam-accounts.repository';
import { AchievementsDataService } from './services/achievements-data.service';
import { AchievementSyncDataService } from './services/achievement-sync-data.service';
import { ActivityEventsDataService } from './services/activity-events-data.service';
import { AppUsersDataService } from './services/app-users-data.service';
import { AuthCallbackDataService } from './services/auth-callback-data.service';
import { BadgesDataService } from './services/badges-data.service';
import { ContentReportsDataService } from './services/content-reports-data.service';
import { DashboardDataService } from './services/dashboard-data.service';
import { GamesDataService } from './services/games-data.service';
import { GuideCommentsDataService } from './services/guide-comments-data.service';
import { GuideAchievementsDataService } from './services/guide-achievements-data.service';
import { GuideSectionsDataService } from './services/guide-sections-data.service';
import { GuideVotesDataService } from './services/guide-votes-data.service';
import { GuidesDataService } from './services/guides-data.service';
import { GamingSessionAchievementsDataService } from './services/gaming-session-achievements-data.service';
import { GamingSessionParticipantsDataService } from './services/gaming-session-participants-data.service';
import { GamingSessionsDataService } from './services/gaming-sessions-data.service';
import { SessionCommentsDataService } from './services/session-comments-data.service';
import { LeaderboardsDataService } from './services/leaderboards-data.service';
import { ProfileAchievementsDataService } from './services/profile-achievements-data.service';
import { ProfileBadgeBackfillDataService } from './services/profile-badge-backfill-data.service';
import { ProfileBadgesDataService } from './services/profile-badges-data.service';
import { ProfileGamesDataService } from './services/profile-games-data.service';
import { ProfileMilestoneBackfillDataService } from './services/profile-milestone-backfill-data.service';
import { ProfileMilestonesDataService } from './services/profile-milestones-data.service';
import { ProfileSnapshotsDataService } from './services/profile-snapshots-data.service';
import { ProfileShowcaseItemsDataService } from './services/profile-showcase-items-data.service';
import { PublicProfilesDataService } from './services/public-profiles-data.service';
import { AuthSessionsDataService } from './services/auth-sessions-data.service';
import { SteamProfilesDataService } from './services/steam-profiles-data.service';
import { TargetsDataService } from './services/targets-data.service';
import { SyncRunsDataService } from './services/sync-runs-data.service';
import { UserPreferencesDataService } from './services/user-preferences-data.service';
import { UserSteamAccountsDataService } from './services/user-steam-accounts-data.service';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [
    DatabaseService,
    ActivityEventsRepository,
    AchievementSyncRepository,
    AuthCallbackRepository,
    AuthSessionsRepository,
    BadgesRepository,
    ContentReportsRepository,
    DashboardRepository,
    SteamProfilesRepository,
    TargetsRepository,
    AppUsersRepository,
    UserSteamAccountsRepository,
    UserPreferencesRepository,
    PublicProfilesRepository,
    GamesRepository,
    GuidesRepository,
    GuideCommentsRepository,
    GuideVotesRepository,
    GamingSessionsRepository,
    SessionCommentsRepository,
    GamingSessionParticipantsRepository,
    GamingSessionAchievementsRepository,
    GuideSectionsRepository,
    GuideAchievementsRepository,
    LeaderboardsRepository,
    ProfileGamesRepository,
    ProfileBadgesRepository,
    ProfileMilestonesRepository,
    ProfileSnapshotsRepository,
    ProfileShowcaseItemsRepository,
    AchievementsRepository,
    ProfileAchievementsRepository,
    SyncRunsRepository,
    ActivityEventsDataService,
    AchievementSyncDataService,
    AuthCallbackDataService,
    BadgesDataService,
    ContentReportsDataService,
    DashboardDataService,
    AppUsersDataService,
    SteamProfilesDataService,
    TargetsDataService,
    UserSteamAccountsDataService,
    UserPreferencesDataService,
    PublicProfilesDataService,
    AuthSessionsDataService,
    GamesDataService,
    GuidesDataService,
    GuideCommentsDataService,
    GuideVotesDataService,
    GamingSessionsDataService,
    SessionCommentsDataService,
    GamingSessionParticipantsDataService,
    GamingSessionAchievementsDataService,
    GuideSectionsDataService,
    GuideAchievementsDataService,
    LeaderboardsDataService,
    ProfileGamesDataService,
    ProfileBadgeBackfillDataService,
    ProfileBadgesDataService,
    ProfileMilestoneBackfillDataService,
    ProfileMilestonesDataService,
    ProfileSnapshotsDataService,
    ProfileShowcaseItemsDataService,
    AchievementsDataService,
    ProfileAchievementsDataService,
    SyncRunsDataService,
  ],
  exports: [
    DatabaseService,
    ActivityEventsDataService,
    AchievementSyncDataService,
    AuthCallbackDataService,
    BadgesDataService,
    ContentReportsDataService,
    DashboardDataService,
    AppUsersDataService,
    SteamProfilesDataService,
    TargetsDataService,
    GamesDataService,
    GuidesDataService,
    GuideCommentsDataService,
    GuideVotesDataService,
    GamingSessionsDataService,
    SessionCommentsDataService,
    GamingSessionParticipantsDataService,
    GamingSessionAchievementsDataService,
    GuideSectionsDataService,
    GuideAchievementsDataService,
    LeaderboardsDataService,
    ProfileGamesDataService,
    ProfileBadgeBackfillDataService,
    ProfileBadgesDataService,
    ProfileMilestoneBackfillDataService,
    ProfileMilestonesDataService,
    ProfileSnapshotsDataService,
    ProfileShowcaseItemsDataService,
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
