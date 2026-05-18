import { describe, expect, it, vi } from 'vitest';

import type { ActivityEventsDataService } from '../../db/services/activity-events-data.service';
import type { DashboardDataService } from '../../db/services/dashboard-data.service';
import type { GuidesDataService } from '../../db/services/guides-data.service';
import type { ProfileBadgesDataService } from '../../db/services/profile-badges-data.service';
import type { ProfileGamesDataService } from '../../db/services/profile-games-data.service';
import type { ProfileMilestonesDataService } from '../../db/services/profile-milestones-data.service';
import type { PublicProfilesDataService } from '../../db/services/public-profiles-data.service';
import type { SteamProfilesDataService } from '../../db/services/steam-profiles-data.service';
import type { SyncRunsDataService } from '../../db/services/sync-runs-data.service';
import type { TargetsDataService } from '../../db/services/targets-data.service';
import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import { DashboardService } from './dashboard.service';
import { DashboardStatusDto, DashboardTargetTypeDto } from './dto/dashboard-response.dto';

describe('DashboardService', () => {
  it('returns an empty link-required dashboard for authenticated users without a linked Steam profile', async () => {
    const service = createService().service;

    await expect(
      service.getMyDashboard(createAuthenticatedUser({ linked: false })),
    ).resolves.toMatchObject({
      status: DashboardStatusDto.LinkRequired,
      profile: null,
      summary: { totalGames: 0 },
      nextTargets: [],
    });
  });

  it('returns summary, deterministic targets, and profile-scoped activity for linked users', async () => {
    const { service, profileGamesDataService, dashboardDataService } = createService();

    const dashboard = await service.getMyDashboard(createAuthenticatedUser());

    expect(dashboard.status).toBe(DashboardStatusDto.Ready);
    expect(dashboard.profile).toMatchObject({
      steamId: '76561198000000000',
      publicSlug: 'demo-hunter',
    });
    expect(dashboard.summary).toMatchObject({
      totalGames: 3,
      completedGames: 1,
      totalAchievements: 20,
      unlockedAchievements: 15,
      remainingAchievements: 5,
    });
    expect(dashboard.nextTargets.map((target) => target.type)).toEqual([
      DashboardTargetTypeDto.ClosestCompletion,
      DashboardTargetTypeDto.RecentlyPlayedIncomplete,
      DashboardTargetTypeDto.HighPlaytimeUnfinished,
      DashboardTargetTypeDto.MetadataOnly,
      DashboardTargetTypeDto.NotSynced,
      DashboardTargetTypeDto.GuideAvailable,
      DashboardTargetTypeDto.SessionAvailable,
    ]);
    expect(dashboard.nextTargets[0].reason).toBe('Only 1 achievement remaining');
    expect(dashboard.recentActivity).toHaveLength(1);
    expect(dashboard.latestSyncRuns).toHaveLength(1);
    expect(dashboard.activeTargets.games).toHaveLength(1);
    expect(dashboard.activeTargets.achievements).toHaveLength(1);
    expect(dashboard.activeTargets.games[0]).toMatchObject({
      type: 'game',
      priority: 'high',
      game: { steamAppId: 910002 },
    });
    expect(dashboard.activeTargets.achievements[0]).toMatchObject({
      type: 'achievement',
      achievement: { id: 'achievement-id', unlockState: 'unknown' },
    });
    expect(dashboard.milestones).toHaveLength(1);
    expect(dashboard.badges).toHaveLength(1);
    expect(dashboard.sessions.hosted).toHaveLength(1);
    expect(dashboard.guides.authored).toHaveLength(1);
    expect(JSON.stringify(dashboard)).not.toContain('session_token_hash');
    expect(profileGamesDataService.getProfileGameSummary).toHaveBeenCalledWith(
      'profile-id',
    );
    expect(dashboardDataService.countDataQualityGames).toHaveBeenCalledWith(
      'profile-id',
    );
  });
});

function createService(): {
  service: DashboardService;
  profileGamesDataService: {
    getProfileGameSummary: ReturnType<typeof vi.fn>;
    getAverageCompletionPercentage: ReturnType<typeof vi.fn>;
    findNearestCompletionsWithGames: ReturnType<typeof vi.fn>;
    findLibraryByProfileId: ReturnType<typeof vi.fn>;
  };
  dashboardDataService: {
    findMetadataOnlyGames: ReturnType<typeof vi.fn>;
    findNotSyncedGames: ReturnType<typeof vi.fn>;
    countDataQualityGames: ReturnType<typeof vi.fn>;
    findGuideSuggestionsForProfile: ReturnType<typeof vi.fn>;
    findHostedSessionsForUser: ReturnType<typeof vi.fn>;
    findJoinedSessionsForUser: ReturnType<typeof vi.fn>;
    findUpcomingOwnedSessions: ReturnType<typeof vi.fn>;
  };
  targetsDataService: {
    findActiveGameTargetsForDashboard: ReturnType<typeof vi.fn>;
    findActiveAchievementTargetsForDashboard: ReturnType<typeof vi.fn>;
  };
} {
  const closestGame = createProfileGameRow({
    steamAppId: 910002,
    name: 'Almost Done',
    totalAchievements: 8,
    unlockedAchievements: 7,
    completionPercentage: 87.5,
    metadataCount: 8,
    unlockCount: 8,
  });
  const recentGame = createProfileGameRow({
    steamAppId: 910003,
    name: 'Recent Run',
    totalAchievements: 10,
    unlockedAchievements: 5,
    completionPercentage: 50,
    playtimeTwoWeeksMinutes: 45,
    metadataCount: 10,
    unlockCount: 10,
  });
  const highPlaytimeGame = createProfileGameRow({
    steamAppId: 910004,
    name: 'Long Haul',
    totalAchievements: 10,
    unlockedAchievements: 3,
    completionPercentage: 30,
    playtimeMinutes: 900,
    metadataCount: 10,
    unlockCount: 10,
  });
  const metadataOnlyGame = createProfileGameRow({
    steamAppId: 910005,
    name: 'Metadata Only',
    totalAchievements: 0,
    unlockedAchievements: 0,
    completionPercentage: 0,
    metadataCount: 12,
    unlockCount: 0,
  });
  const notSyncedGame = createProfileGameRow({
    steamAppId: 910006,
    name: 'Not Synced',
    totalAchievements: 0,
    unlockedAchievements: 0,
    completionPercentage: 0,
    metadataCount: 0,
    unlockCount: 0,
  });
  const guide = createGuide();
  const session = createSession();
  const activeGameTarget = createGameTargetRow(closestGame);
  const activeAchievementTarget = createAchievementTargetRow();

  const steamProfilesDataService = {
    findById: vi.fn(async () => ({
      id: 'profile-id',
      steamId: '76561198000000000',
      personaName: 'Demo Hunter',
      avatarUrl: null,
      profileUrl: 'https://steamcommunity.com/profiles/76561198000000000',
      visibilityState: 3,
      isPrivate: false,
      lastSyncedAt: new Date('2026-05-18T12:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    })),
  };
  const publicProfilesDataService = {
    findByUserAndProfileId: vi.fn(async () => ({
      id: 'public-profile-id',
      userId: 'user-id',
      steamProfileId: 'profile-id',
      slug: 'demo-hunter',
      isPublic: true,
      settings: {},
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    })),
  };
  const profileGamesDataService = {
    getProfileGameSummary: vi.fn(async () => ({
      totalGames: 3,
      completedGames: 1,
      totalAchievements: 20,
      unlockedAchievements: 15,
    })),
    getAverageCompletionPercentage: vi.fn(async () => 66.666),
    findNearestCompletionsWithGames: vi.fn(async () => [closestGame]),
    findLibraryByProfileId: vi
      .fn()
      .mockResolvedValueOnce([recentGame])
      .mockResolvedValueOnce([highPlaytimeGame]),
  };
  const syncRunsDataService = {
    findLatestByProfile: vi.fn(async () => [
      {
        id: 'sync-run-id',
        profileId: 'profile-id',
        syncType: 'achievements',
        status: 'success',
        startedAt: new Date('2026-05-18T11:59:00.000Z'),
        finishedAt: new Date('2026-05-18T12:00:00.000Z'),
        errorMessage: null,
        metadata: {},
        createdAt: new Date('2026-05-18T11:59:00.000Z'),
      },
    ]),
  };
  const activityEventsDataService = {
    findPublic: vi.fn(async () => [
      {
        event: {
          id: 'activity-id',
          actorUserId: null,
          steamProfileId: 'profile-id',
          eventType: 'profile_synced',
          visibility: 'public',
          entityType: 'steam_profile',
          entityId: 'profile-id',
          steamAppId: null,
          metadata: { scope: 'achievements' },
          occurredAt: new Date('2026-05-18T12:00:00.000Z'),
          createdAt: new Date('2026-05-18T12:00:00.000Z'),
        },
        actor: null,
        steamProfile: null,
      },
    ]),
  };
  const profileMilestonesDataService = {
    findBySteamProfileId: vi.fn(async () => [
      {
        id: 'milestone-id',
        steamProfileId: 'profile-id',
        milestoneType: 'first_sync',
        thresholdValue: null,
        title: 'First Sync',
        description: 'Synced this Steam profile for the first time.',
        achievedAt: new Date('2026-05-18T12:00:00.000Z'),
        sourceSnapshotId: null,
        metadata: {},
        createdAt: new Date('2026-05-18T12:00:00.000Z'),
      },
    ]),
  };
  const profileBadgesDataService = {
    findBySteamProfileId: vi.fn(async () => [
      {
        profileBadge: {
          id: 'profile-badge-id',
          steamProfileId: 'profile-id',
          badgeId: 'badge-id',
          sourceMilestoneId: 'milestone-id',
          earnedAt: new Date('2026-05-18T12:00:00.000Z'),
          metadata: {},
          createdAt: new Date('2026-05-18T12:00:00.000Z'),
        },
        badge: {
          id: 'badge-id',
          code: 'first-sync',
          name: 'First Sync',
          description: null,
          badgeType: 'milestone',
          tier: 'bronze',
          iconKey: 'spark',
          sortOrder: 1,
          isActive: true,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      },
    ]),
  };
  const guidesDataService = {
    findByAuthorUserId: vi.fn(async () => [guide]),
  };
  const dashboardDataService = {
    findMetadataOnlyGames: vi.fn(async () => [metadataOnlyGame]),
    findNotSyncedGames: vi.fn(async () => [notSyncedGame]),
    countDataQualityGames: vi.fn(async () => ({
      metadataOnlyGames: 1,
      notSyncedGames: 1,
    })),
    findGuideSuggestionsForProfile: vi.fn(async () => [guide]),
    findHostedSessionsForUser: vi.fn(async () => [session]),
    findJoinedSessionsForUser: vi.fn(async () => [session]),
    findUpcomingOwnedSessions: vi.fn(async () => [session]),
  };
  const targetsDataService = {
    findActiveGameTargetsForDashboard: vi.fn(async () => [activeGameTarget]),
    findActiveAchievementTargetsForDashboard: vi.fn(async () => [
      activeAchievementTarget,
    ]),
  };

  const service = new DashboardService(
    steamProfilesDataService as unknown as SteamProfilesDataService,
    publicProfilesDataService as unknown as PublicProfilesDataService,
    profileGamesDataService as unknown as ProfileGamesDataService,
    syncRunsDataService as unknown as SyncRunsDataService,
    activityEventsDataService as unknown as ActivityEventsDataService,
    profileMilestonesDataService as unknown as ProfileMilestonesDataService,
    profileBadgesDataService as unknown as ProfileBadgesDataService,
    guidesDataService as unknown as GuidesDataService,
    dashboardDataService as unknown as DashboardDataService,
    targetsDataService as unknown as TargetsDataService,
  );

  return {
    service,
    profileGamesDataService,
    dashboardDataService,
    targetsDataService,
  };
}

function createAuthenticatedUser(input: { linked?: boolean } = {}): AuthenticatedUserContext {
  const linked = input.linked ?? true;

  return {
    userId: 'user-id',
    user: {
      id: 'user-id',
      displayName: 'Demo Hunter',
      avatarUrl: null,
      role: 'user',
      status: 'active',
    },
    steamAccount: linked
      ? {
          steamId: '76561198000000000',
          steamProfileId: 'profile-id',
          personaName: 'Demo Hunter',
          avatarUrl: null,
          isPrimary: true,
        }
      : null,
    publicProfile: linked ? { slug: 'demo-hunter', isPublic: true } : null,
  };
}

function createProfileGameRow(input: {
  steamAppId: number;
  name: string;
  totalAchievements: number;
  unlockedAchievements: number;
  completionPercentage: number;
  metadataCount: number;
  unlockCount: number;
  playtimeMinutes?: number;
  playtimeTwoWeeksMinutes?: number;
}) {
  return {
    profileGame: {
      id: `profile-game-${input.steamAppId}`,
      profileId: 'profile-id',
      gameId: `game-${input.steamAppId}`,
      playtimeMinutes: input.playtimeMinutes ?? 0,
      playtimeTwoWeeksMinutes: input.playtimeTwoWeeksMinutes ?? 0,
      totalAchievements: input.totalAchievements,
      unlockedAchievements: input.unlockedAchievements,
      completionPercentage: input.completionPercentage,
      lastPlayedAt:
        (input.playtimeTwoWeeksMinutes ?? 0) > 0
          ? new Date('2026-05-18T10:00:00.000Z')
          : null,
      lastSyncedAt: new Date('2026-05-18T12:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    game: {
      id: `game-${input.steamAppId}`,
      steamAppId: input.steamAppId,
      name: input.name,
      iconUrl: null,
      logoUrl: null,
      hasAchievements: input.metadataCount > 0,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    achievementMetadataCount: input.metadataCount,
    knownUnlockStateCount: input.unlockCount,
  };
}

function createGuide() {
  return {
    guide: {
      id: 'guide-id',
      steamAppId: 910002,
      authorUserId: 'user-id',
      title: 'Completion Roadmap',
      slug: 'completion-roadmap',
      summary: 'Finish the route.',
      status: 'published',
      visibility: 'public',
      estimatedDifficulty: 4,
      estimatedHours: 8,
      isSpoilerHeavy: false,
      publishedAt: new Date('2026-05-18T12:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-05-18T12:00:00.000Z'),
    },
    author: {
      id: 'user-id',
      displayName: 'Demo Hunter',
      avatarUrl: null,
      role: 'user',
    },
    game: {
      steamAppId: 910002,
      name: 'Almost Done',
      iconUrl: null,
      logoUrl: null,
    },
  };
}

function createSession() {
  return {
    session: {
      id: 'session-id',
      steamAppId: 910002,
      hostUserId: 'user-id',
      title: 'Co-op clear',
      description: null,
      status: 'open',
      visibility: 'public',
      scheduledStartAt: new Date('2030-05-18T12:00:00.000Z'),
      scheduledEndAt: null,
      timezone: 'UTC',
      maxParticipants: 4,
      externalVoiceUrl: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    game: {
      steamAppId: 910002,
      name: 'Almost Done',
      iconUrl: null,
      logoUrl: null,
    },
    host: {
      displayName: 'Demo Hunter',
      steamId: '76561198000000000',
      avatarUrl: null,
      publicSlug: 'demo-hunter',
    },
    participantCount: 2,
    achievementCount: 1,
  };
}

function createGameTargetRow(row: ReturnType<typeof createProfileGameRow>) {
  return {
    target: {
      id: 'game-target-id',
      userId: 'user-id',
      steamProfileId: 'profile-id',
      gameId: row.game.id,
      status: 'active',
      priority: 'high',
      notes: 'Finish this one',
      targetCompletionPercentage: 100,
      dueDate: '2026-06-01',
      createdAt: new Date('2026-05-18T12:00:00.000Z'),
      updatedAt: new Date('2026-05-18T12:00:00.000Z'),
    },
    game: row.game,
    profileGame: row.profileGame,
    achievementMetadataCount: row.achievementMetadataCount,
    knownUnlockStateCount: row.knownUnlockStateCount,
  };
}

function createAchievementTargetRow() {
  return {
    target: {
      id: 'achievement-target-id',
      userId: 'user-id',
      steamProfileId: 'profile-id',
      achievementId: 'achievement-id',
      status: 'active',
      priority: 'medium',
      notes: null,
      dueDate: null,
      createdAt: new Date('2026-05-18T12:00:00.000Z'),
      updatedAt: new Date('2026-05-18T12:00:00.000Z'),
    },
    achievement: {
      id: 'achievement-id',
      steamAppId: 910002,
      apiName: 'ACH_ALMOST_DONE',
      displayName: 'Almost Done',
      description: null,
      iconUrl: null,
      iconGrayUrl: null,
      globalPercentage: 12.5,
      hidden: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    game: {
      id: 'game-910002',
      steamAppId: 910002,
      name: 'Almost Done',
      iconUrl: null,
      logoUrl: null,
      hasAchievements: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    profileAchievement: null,
  };
}
