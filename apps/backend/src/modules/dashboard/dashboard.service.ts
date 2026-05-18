import { Injectable } from '@nestjs/common';

import {
  ActivityEventsDataService,
  type ActivityEventWithPublicData,
} from '../../db/services/activity-events-data.service';
import {
  DashboardDataService,
  type DashboardProfileGameRow,
} from '../../db/services/dashboard-data.service';
import { GuidesDataService, type GuideWithAuthor } from '../../db/services/guides-data.service';
import {
  ProfileBadgesDataService,
  type ProfileBadgeWithBadge,
} from '../../db/services/profile-badges-data.service';
import {
  ProfileGamesDataService,
  type ProfileGameSummary,
  type ProfileGameWithGame,
} from '../../db/services/profile-games-data.service';
import {
  ProfileMilestonesDataService,
  type ProfileMilestone,
} from '../../db/services/profile-milestones-data.service';
import { PublicProfilesDataService } from '../../db/services/public-profiles-data.service';
import { SteamProfilesDataService } from '../../db/services/steam-profiles-data.service';
import { SyncRunsDataService, type SyncRun } from '../../db/services/sync-runs-data.service';
import { TargetsDataService } from '../../db/services/targets-data.service';
import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import type { AchievementDataState } from '../games/dto/achievement-data-state.dto';
import {
  DashboardStatusDto,
  DashboardTargetTypeDto,
  type DashboardActivityResponseDto,
  type DashboardBadgeResponseDto,
  type DashboardGameRefResponseDto,
  type DashboardGuideResponseDto,
  type DashboardMilestoneResponseDto,
  type DashboardNextTargetResponseDto,
  type DashboardSessionResponseDto,
  type DashboardSummaryResponseDto,
  type DashboardSyncRunResponseDto,
  type MyDashboardResponseDto,
} from './dto/dashboard-response.dto';
import type { SessionSummaryRow } from '../../db/services/gaming-sessions-data.service';
import { mapAchievementTarget, mapGameTarget } from '../targets/targets.service';

const TARGET_LIMIT = 10;
const SECTION_LIMIT = 5;

@Injectable()
export class DashboardService {
  constructor(
    private readonly steamProfilesDataService: SteamProfilesDataService,
    private readonly publicProfilesDataService: PublicProfilesDataService,
    private readonly profileGamesDataService: ProfileGamesDataService,
    private readonly syncRunsDataService: SyncRunsDataService,
    private readonly activityEventsDataService: ActivityEventsDataService,
    private readonly profileMilestonesDataService: ProfileMilestonesDataService,
    private readonly profileBadgesDataService: ProfileBadgesDataService,
    private readonly guidesDataService: GuidesDataService,
    private readonly dashboardDataService: DashboardDataService,
    private readonly targetsDataService: TargetsDataService,
  ) {}

  async getMyDashboard(
    currentUser: AuthenticatedUserContext,
  ): Promise<MyDashboardResponseDto> {
    if (currentUser.steamAccount === null) {
      return createLinkRequiredDashboard(currentUser);
    }

    const steamProfile =
      await this.steamProfilesDataService.findById(
        currentUser.steamAccount.steamProfileId,
      );

    if (steamProfile === null) {
      return createLinkRequiredDashboard(currentUser);
    }

    const [
      publicProfile,
      summary,
      averageCompletionPercentage,
      syncRuns,
      activity,
      milestones,
      badges,
      closestTargets,
      recentIncomplete,
      highPlaytimeUnfinished,
      metadataOnlyGames,
      notSyncedGames,
      dataQualityCounts,
      authoredGuides,
      suggestedGuides,
      hostedSessions,
      joinedSessions,
      upcomingOwnedSessions,
      activeGameTargets,
      activeAchievementTargets,
    ] = await Promise.all([
      this.publicProfilesDataService.findByUserAndProfileId(
        currentUser.userId,
        steamProfile.id,
      ),
      this.profileGamesDataService.getProfileGameSummary(steamProfile.id),
      this.profileGamesDataService.getAverageCompletionPercentage(steamProfile.id),
      this.syncRunsDataService.findLatestByProfile(steamProfile.id, SECTION_LIMIT),
      this.activityEventsDataService.findPublic({
        steamProfileId: steamProfile.id,
        limit: SECTION_LIMIT,
        offset: 0,
      }),
      this.profileMilestonesDataService.findBySteamProfileId(steamProfile.id, {
        limit: SECTION_LIMIT,
        offset: 0,
      }),
      this.profileBadgesDataService.findBySteamProfileId(steamProfile.id),
      this.profileGamesDataService.findNearestCompletionsWithGames(
        steamProfile.id,
        SECTION_LIMIT,
      ),
      this.profileGamesDataService.findLibraryByProfileId(steamProfile.id, {
        status: 'incomplete',
        sort: 'recently_played',
        order: 'desc',
        limit: SECTION_LIMIT,
        offset: 0,
      }),
      this.profileGamesDataService.findLibraryByProfileId(steamProfile.id, {
        status: 'incomplete',
        sort: 'playtime',
        order: 'desc',
        limit: SECTION_LIMIT,
        offset: 0,
      }),
      this.dashboardDataService.findMetadataOnlyGames(steamProfile.id, SECTION_LIMIT),
      this.dashboardDataService.findNotSyncedGames(steamProfile.id, SECTION_LIMIT),
      this.dashboardDataService.countDataQualityGames(steamProfile.id),
      this.guidesDataService.findByAuthorUserId(currentUser.userId),
      this.dashboardDataService.findGuideSuggestionsForProfile(
        steamProfile.id,
        SECTION_LIMIT,
      ),
      this.dashboardDataService.findHostedSessionsForUser(
        currentUser.userId,
        SECTION_LIMIT,
      ),
      this.dashboardDataService.findJoinedSessionsForUser(
        currentUser.userId,
        SECTION_LIMIT,
      ),
      this.dashboardDataService.findUpcomingOwnedSessions(
        steamProfile.id,
        SECTION_LIMIT,
      ),
      this.targetsDataService.findActiveGameTargetsForDashboard(
        currentUser.userId,
        SECTION_LIMIT,
      ),
      this.targetsDataService.findActiveAchievementTargetsForDashboard(
        currentUser.userId,
        SECTION_LIMIT,
      ),
    ]);

    const latestFinishedSync = syncRuns.find((run) => run.finishedAt !== null);

    return {
      status: DashboardStatusDto.Ready,
      viewer: {
        id: currentUser.user.id,
        displayName: currentUser.user.displayName,
        avatarUrl: currentUser.user.avatarUrl,
      },
      profile: {
        steamId: steamProfile.steamId,
        steamProfileId: steamProfile.id,
        personaName: steamProfile.personaName,
        avatarUrl: steamProfile.avatarUrl,
        profileUrl: steamProfile.profileUrl,
        publicSlug: publicProfile?.slug ?? currentUser.publicProfile?.slug ?? null,
        publicProfileIsPublished:
          publicProfile?.isPublic ?? currentUser.publicProfile?.isPublic ?? false,
        lastSyncedAt: toIsoOrNull(steamProfile.lastSyncedAt),
      },
      summary: mapSummary(summary, averageCompletionPercentage),
      latestSyncRuns: syncRuns.map(mapSyncRun),
      nextTargets: buildNextTargets({
        steamId: steamProfile.steamId,
        closestTargets,
        recentIncomplete,
        highPlaytimeUnfinished,
        metadataOnlyGames,
        notSyncedGames,
        suggestedGuides,
        upcomingOwnedSessions,
      }),
      activeTargets: {
        games: activeGameTargets.map(mapGameTarget),
        achievements: activeAchievementTargets.map(mapAchievementTarget),
      },
      recentActivity: activity.map(mapActivity),
      milestones: milestones.map(mapMilestone),
      badges: badges.slice(0, SECTION_LIMIT).map(mapBadge),
      sessions: {
        hosted: hostedSessions.map(mapSession),
        joined: joinedSessions.map(mapSession),
        upcomingForOwnedGames: upcomingOwnedSessions.map(mapSession),
      },
      guides: {
        authored: authoredGuides.slice(0, SECTION_LIMIT).map(mapGuide),
        suggested: suggestedGuides.map(mapGuide),
      },
      dataQuality: {
        metadataOnlyGames: dataQualityCounts.metadataOnlyGames,
        notSyncedGames: dataQualityCounts.notSyncedGames,
        lastSyncAt: toIsoOrNull(latestFinishedSync?.finishedAt ?? steamProfile.lastSyncedAt),
        metadataOnlyExamples: metadataOnlyGames.map(mapGameRef),
        notSyncedExamples: notSyncedGames.map(mapGameRef),
      },
    };
  }
}

function createLinkRequiredDashboard(
  currentUser: AuthenticatedUserContext,
): MyDashboardResponseDto {
  return {
    status: DashboardStatusDto.LinkRequired,
    viewer: {
      id: currentUser.user.id,
      displayName: currentUser.user.displayName,
      avatarUrl: currentUser.user.avatarUrl,
    },
    profile: null,
    summary: {
      totalGames: 0,
      completedGames: 0,
      totalAchievements: 0,
      unlockedAchievements: 0,
      remainingAchievements: 0,
      averageCompletionPercentage: 0,
    },
    latestSyncRuns: [],
    nextTargets: [],
    activeTargets: { games: [], achievements: [] },
    recentActivity: [],
    milestones: [],
    badges: [],
    sessions: { hosted: [], joined: [], upcomingForOwnedGames: [] },
    guides: { authored: [], suggested: [] },
    dataQuality: {
      metadataOnlyGames: 0,
      notSyncedGames: 0,
      lastSyncAt: null,
      metadataOnlyExamples: [],
      notSyncedExamples: [],
    },
  };
}

function mapSummary(
  summary: ProfileGameSummary,
  averageCompletionPercentage: number,
): DashboardSummaryResponseDto {
  return {
    totalGames: summary.totalGames,
    completedGames: summary.completedGames,
    totalAchievements: summary.totalAchievements,
    unlockedAchievements: summary.unlockedAchievements,
    remainingAchievements: Math.max(
      summary.totalAchievements - summary.unlockedAchievements,
      0,
    ),
    averageCompletionPercentage: roundTwo(averageCompletionPercentage),
  };
}

function buildNextTargets(input: {
  steamId: string;
  closestTargets: ProfileGameWithGame[];
  recentIncomplete: ProfileGameWithGame[];
  highPlaytimeUnfinished: ProfileGameWithGame[];
  metadataOnlyGames: DashboardProfileGameRow[];
  notSyncedGames: DashboardProfileGameRow[];
  suggestedGuides: GuideWithAuthor[];
  upcomingOwnedSessions: SessionSummaryRow[];
}): DashboardNextTargetResponseDto[] {
  const targets: DashboardNextTargetResponseDto[] = [];
  const seen = new Set<string>();

  const addGameTarget = (
    type: DashboardTargetTypeDto,
    row: ProfileGameWithGame,
    reason: string,
  ): void => {
    const key = `${type}:${row.game.steamAppId}`;
    if (seen.has(key) || targets.length >= TARGET_LIMIT) {
      return;
    }

    seen.add(key);
    targets.push({
      type,
      reason,
      href: `/profiles/${input.steamId}/games/${row.game.steamAppId}`,
      game: mapGameRef(row),
      guideId: null,
      guideSlug: null,
      sessionId: null,
    });
  };

  for (const row of input.closestTargets) {
    const game = mapGameRef(row);
    if (game.achievementDataState !== 'unlock_state_synced') {
      continue;
    }
    addGameTarget(
      DashboardTargetTypeDto.ClosestCompletion,
      row,
      `Only ${game.remainingAchievements} achievement${game.remainingAchievements === 1 ? '' : 's'} remaining`,
    );
  }

  for (const row of input.recentIncomplete) {
    if (row.profileGame.playtimeTwoWeeksMinutes <= 0 && row.profileGame.lastPlayedAt === null) {
      continue;
    }
    addGameTarget(
      DashboardTargetTypeDto.RecentlyPlayedIncomplete,
      row,
      'Recently played and incomplete',
    );
  }

  for (const row of input.highPlaytimeUnfinished) {
    if (row.profileGame.playtimeMinutes <= 0) {
      continue;
    }
    addGameTarget(
      DashboardTargetTypeDto.HighPlaytimeUnfinished,
      row,
      `${formatHours(row.profileGame.playtimeMinutes)} played and unfinished`,
    );
  }

  for (const row of input.metadataOnlyGames) {
    addGameTarget(
      DashboardTargetTypeDto.MetadataOnly,
      row,
      'Achievement metadata is available, but Steam did not provide unlock state',
    );
  }

  for (const row of input.notSyncedGames) {
    addGameTarget(
      DashboardTargetTypeDto.NotSynced,
      row,
      'Achievement metadata has not been synced for this game yet',
    );
  }

  for (const guide of input.suggestedGuides) {
    if (targets.length >= TARGET_LIMIT) {
      break;
    }

    const key = `${DashboardTargetTypeDto.GuideAvailable}:${guide.game.steamAppId}:${guide.guide.id}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    targets.push({
      type: DashboardTargetTypeDto.GuideAvailable,
      reason: 'Published guide available for an owned game',
      href: `/games/${guide.game.steamAppId}/guides/${guide.guide.slug}`,
      game: mapGuideGameRef(guide),
      guideId: guide.guide.id,
      guideSlug: guide.guide.slug,
      sessionId: null,
    });
  }

  for (const session of input.upcomingOwnedSessions) {
    if (targets.length >= TARGET_LIMIT) {
      break;
    }

    const key = `${DashboardTargetTypeDto.SessionAvailable}:${session.session.id}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    targets.push({
      type: DashboardTargetTypeDto.SessionAvailable,
      reason: 'Upcoming public session for a game you own',
      href: `/sessions/${session.session.id}`,
      game: mapSessionGameRef(session),
      guideId: null,
      guideSlug: null,
      sessionId: session.session.id,
    });
  }

  return targets;
}

function mapGameRef(row: ProfileGameWithGame): DashboardGameRefResponseDto {
  const achievementMetadataCount =
    row.achievementMetadataCount ?? row.profileGame.totalAchievements;
  const knownUnlockStateCount =
    row.knownUnlockStateCount ?? row.profileGame.totalAchievements;
  const totalAchievements =
    achievementMetadataCount > 0
      ? achievementMetadataCount
      : row.profileGame.totalAchievements;
  const achievementDataState = getAchievementDataState(
    achievementMetadataCount,
    knownUnlockStateCount,
  );
  const remainingAchievements =
    achievementDataState === 'metadata_only'
      ? 0
      : Math.max(totalAchievements - row.profileGame.unlockedAchievements, 0);

  return {
    steamAppId: row.game.steamAppId,
    name: row.game.name,
    iconUrl: row.game.iconUrl,
    totalAchievements,
    unlockedAchievements: row.profileGame.unlockedAchievements,
    remainingAchievements,
    completionPercentage: row.profileGame.completionPercentage,
    achievementDataState,
    playtimeMinutes: row.profileGame.playtimeMinutes,
    playtimeTwoWeeksMinutes: row.profileGame.playtimeTwoWeeksMinutes,
    lastPlayedAt: toIsoOrNull(row.profileGame.lastPlayedAt),
  };
}

function mapGuideGameRef(row: GuideWithAuthor): DashboardGameRefResponseDto {
  return {
    steamAppId: row.game.steamAppId,
    name: row.game.name,
    iconUrl: row.game.iconUrl,
    totalAchievements: 0,
    unlockedAchievements: 0,
    remainingAchievements: 0,
    completionPercentage: 0,
    achievementDataState: 'not_synced',
    playtimeMinutes: 0,
    playtimeTwoWeeksMinutes: 0,
    lastPlayedAt: null,
  };
}

function mapSessionGameRef(row: SessionSummaryRow): DashboardGameRefResponseDto {
  return {
    steamAppId: row.game.steamAppId,
    name: row.game.name,
    iconUrl: row.game.iconUrl,
    totalAchievements: 0,
    unlockedAchievements: 0,
    remainingAchievements: 0,
    completionPercentage: 0,
    achievementDataState: 'not_synced',
    playtimeMinutes: 0,
    playtimeTwoWeeksMinutes: 0,
    lastPlayedAt: null,
  };
}

function mapSyncRun(run: SyncRun): DashboardSyncRunResponseDto {
  return {
    id: run.id,
    syncType: run.syncType,
    status: run.status,
    startedAt: run.startedAt.toISOString(),
    finishedAt: toIsoOrNull(run.finishedAt),
    errorMessage: run.errorMessage,
  };
}

function mapActivity(row: ActivityEventWithPublicData): DashboardActivityResponseDto {
  return {
    id: row.event.id,
    eventType: row.event.eventType,
    occurredAt: row.event.occurredAt.toISOString(),
    steamAppId: row.event.steamAppId,
    entityType: row.event.entityType,
    metadata: row.event.metadata,
  };
}

function mapMilestone(milestone: ProfileMilestone): DashboardMilestoneResponseDto {
  return {
    id: milestone.id,
    milestoneType: milestone.milestoneType,
    thresholdValue: milestone.thresholdValue,
    title: milestone.title,
    description: milestone.description,
    achievedAt: milestone.achievedAt.toISOString(),
  };
}

function mapBadge(row: ProfileBadgeWithBadge): DashboardBadgeResponseDto {
  return {
    id: row.profileBadge.id,
    code: row.badge.code,
    name: row.badge.name,
    tier: row.badge.tier,
    iconKey: row.badge.iconKey,
    earnedAt: row.profileBadge.earnedAt.toISOString(),
  };
}

function mapSession(row: SessionSummaryRow): DashboardSessionResponseDto {
  return {
    id: row.session.id,
    steamAppId: row.game.steamAppId,
    gameName: row.game.name,
    gameIconUrl: row.game.iconUrl,
    title: row.session.title,
    status: row.session.status,
    scheduledStartAt: row.session.scheduledStartAt.toISOString(),
    maxParticipants: row.session.maxParticipants,
    participantCount: row.participantCount,
    achievementCount: row.achievementCount,
  };
}

function mapGuide(row: GuideWithAuthor): DashboardGuideResponseDto {
  return {
    id: row.guide.id,
    steamAppId: row.game.steamAppId,
    gameName: row.game.name,
    gameIconUrl: row.game.iconUrl,
    title: row.guide.title,
    slug: row.guide.slug,
    summary: row.guide.summary,
    status: row.guide.status,
    visibility: row.guide.visibility,
    publishedAt: toIsoOrNull(row.guide.publishedAt),
  };
}

function getAchievementDataState(
  achievementMetadataCount: number,
  knownUnlockStateCount: number,
): AchievementDataState {
  if (achievementMetadataCount > 0 && knownUnlockStateCount > 0) {
    return 'unlock_state_synced';
  }

  if (achievementMetadataCount > 0) {
    return 'metadata_only';
  }

  return 'not_synced';
}

function toIsoOrNull(value: Date | null | undefined): string | null {
  return value === null || value === undefined ? null : value.toISOString();
}

function roundTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatHours(minutes: number): string {
  const hours = Math.max(Math.round(minutes / 60), 1);
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}
