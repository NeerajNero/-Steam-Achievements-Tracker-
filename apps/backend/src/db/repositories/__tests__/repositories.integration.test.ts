import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { and, eq, gte, like, sql } from 'drizzle-orm';

import { AchievementSyncRepository } from '../achievement-sync.repository';
import { AchievementsRepository } from '../achievements.repository';
import { AuthCallbackRepository } from '../auth-callback.repository';
import { AppUsersRepository } from '../app-users.repository';
import { GamesRepository } from '../games.repository';
import { ProfileAchievementsRepository } from '../profile-achievements.repository';
import { ProfileGamesRepository } from '../profile-games.repository';
import { PublicProfilesRepository } from '../public-profiles.repository';
import { SteamProfilesRepository } from '../steam-profiles.repository';
import { SyncRunsRepository } from '../sync-runs.repository';
import { UserPreferencesRepository } from '../user-preferences.repository';
import { UserSteamAccountsRepository } from '../user-steam-accounts.repository';
import { DatabaseService } from '../../database.service';
import {
  achievements,
  appUsers,
  authSessions,
  games,
  profileAchievements,
  profileGames,
  publicProfiles,
  steamProfiles,
  syncRuns,
  userPreferences,
  userSteamAccounts,
} from '../../schema';
import type { Game } from '../games.repository';
import type { SteamProfile } from '../steam-profiles.repository';

const testSteamIdPrefix = 'test:repo:';
const testAppIdBase = 900_000_000;

let databaseService: DatabaseService;
let steamProfilesRepository: SteamProfilesRepository;
let gamesRepository: GamesRepository;
let profileGamesRepository: ProfileGamesRepository;
let achievementsRepository: AchievementsRepository;
let achievementSyncRepository: AchievementSyncRepository;
let profileAchievementsRepository: ProfileAchievementsRepository;
let syncRunsRepository: SyncRunsRepository;
let authCallbackRepository: AuthCallbackRepository;
let appUsersRepository: AppUsersRepository;
let userSteamAccountsRepository: UserSteamAccountsRepository;
let userPreferencesRepository: UserPreferencesRepository;
let publicProfilesRepository: PublicProfilesRepository;

interface TestIdentity {
  suffix: string;
  steamId: string;
  appId: number;
}

describe('Drizzle repositories integration', () => {
  beforeAll(() => {
    databaseService = new DatabaseService();
    steamProfilesRepository = new SteamProfilesRepository(databaseService);
    gamesRepository = new GamesRepository(databaseService);
    profileGamesRepository = new ProfileGamesRepository(databaseService);
    achievementsRepository = new AchievementsRepository(databaseService);
    achievementSyncRepository = new AchievementSyncRepository(databaseService);
    profileAchievementsRepository = new ProfileAchievementsRepository(databaseService);
    syncRunsRepository = new SyncRunsRepository(databaseService);
    authCallbackRepository = new AuthCallbackRepository(databaseService);
    appUsersRepository = new AppUsersRepository(databaseService);
    userSteamAccountsRepository = new UserSteamAccountsRepository(databaseService);
    userPreferencesRepository = new UserPreferencesRepository(databaseService);
    publicProfilesRepository = new PublicProfilesRepository(databaseService);
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await databaseService.onModuleDestroy();
  });

  describe('SteamProfilesRepository', () => {
    it('upserts, finds, and updates sync state', async () => {
      const identity = createIdentity();
      const lastSyncedAt = new Date('2026-01-01T00:00:00.000Z');

      const created = await steamProfilesRepository.upsertProfile({
        steamId: identity.steamId,
        personaName: 'Initial Persona',
        visibilityState: 3,
        isPrivate: false,
        lastSyncedAt,
      });

      expect(created.steamId).toBe(identity.steamId);
      expect(created.personaName).toBe('Initial Persona');

      const updated = await steamProfilesRepository.upsertProfile({
        steamId: identity.steamId,
        personaName: 'Updated Persona',
        isPrivate: true,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.personaName).toBe('Updated Persona');
      expect(updated.isPrivate).toBe(true);

      const rows = await databaseService.db
        .select({ total: sql<number>`cast(count(*) as int)` })
        .from(steamProfiles)
        .where(eq(steamProfiles.steamId, identity.steamId));

      expect(rows[0]?.total).toBe(1);

      await expect(steamProfilesRepository.findBySteamId(identity.steamId)).resolves.toMatchObject({
        id: created.id,
      });
      await expect(steamProfilesRepository.findById(created.id)).resolves.toMatchObject({
        steamId: identity.steamId,
      });
      await expect(steamProfilesRepository.findBySteamId(`${identity.steamId}:missing`)).resolves.toBeNull();
      await expect(steamProfilesRepository.findById(randomUUID())).resolves.toBeNull();

      const syncTime = new Date('2026-02-01T00:00:00.000Z');
      const syncState = await steamProfilesRepository.updateSyncState(created.id, {
        lastSyncedAt: syncTime,
        visibilityState: 1,
        isPrivate: true,
      });

      expect(syncState).toMatchObject({
        id: created.id,
        visibilityState: 1,
        isPrivate: true,
      });
      expect(syncState?.lastSyncedAt?.toISOString()).toBe(syncTime.toISOString());
    });
  });

  describe('GamesRepository', () => {
    it('upserts and finds games by Steam app ID and internal ID', async () => {
      const identity = createIdentity();

      const created = await gamesRepository.upsertGame({
        steamAppId: identity.appId,
        name: 'Initial Game',
        hasAchievements: false,
      });

      const updated = await gamesRepository.upsertGame({
        steamAppId: identity.appId,
        name: 'Updated Game',
        hasAchievements: true,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe('Updated Game');
      expect(updated.hasAchievements).toBe(true);

      const rows = await databaseService.db
        .select({ total: sql<number>`cast(count(*) as int)` })
        .from(games)
        .where(eq(games.steamAppId, identity.appId));

      expect(rows[0]?.total).toBe(1);

      await expect(gamesRepository.findBySteamAppId(identity.appId)).resolves.toMatchObject({
        id: created.id,
      });
      await expect(gamesRepository.findById(created.id)).resolves.toMatchObject({
        steamAppId: identity.appId,
      });
      await expect(gamesRepository.findBySteamAppId(identity.appId + 1)).resolves.toBeNull();
      await expect(gamesRepository.findById(randomUUID())).resolves.toBeNull();
    });
  });

  describe('ProfileGamesRepository', () => {
    it('upserts profile games, filters nearest completions, and summarizes profile games', async () => {
      const identity = createIdentity();
      const profile = await createProfile(identity, 'Profile Games Profile');
      const emptyProfile = await createProfile(createIdentity(), 'Empty Profile');
      const nearGame = await createGame(identity.appId, 'Near Game');
      const zeroAchievementGame = await createGame(identity.appId + 1, 'Zero Achievement Game');
      const completedGame = await createGame(identity.appId + 2, 'Completed Game');
      const zeroUnlockedGame = await createGame(identity.appId + 3, 'Zero Unlocked Game');

      const created = await profileGamesRepository.upsertProfileGame({
        profileId: profile.id,
        gameId: nearGame.id,
        totalAchievements: 10,
        unlockedAchievements: 8,
        completionPercentage: 80,
        playtimeMinutes: 60,
      });

      const updated = await profileGamesRepository.upsertProfileGame({
        profileId: profile.id,
        gameId: nearGame.id,
        totalAchievements: 10,
        unlockedAchievements: 9,
        completionPercentage: 90,
        playtimeMinutes: 90,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.unlockedAchievements).toBe(9);
      expect(updated.completionPercentage).toBe(90);

      await profileGamesRepository.upsertProfileGame({
        profileId: profile.id,
        gameId: zeroAchievementGame.id,
        totalAchievements: 0,
        unlockedAchievements: 0,
        completionPercentage: 0,
      });
      await profileGamesRepository.upsertProfileGame({
        profileId: profile.id,
        gameId: completedGame.id,
        totalAchievements: 5,
        unlockedAchievements: 5,
        completionPercentage: 100,
      });
      await profileGamesRepository.upsertProfileGame({
        profileId: profile.id,
        gameId: zeroUnlockedGame.id,
        totalAchievements: 7,
        unlockedAchievements: 0,
        completionPercentage: 0,
      });

      const profileGameRows = await profileGamesRepository.findByProfileId(profile.id);
      expect(profileGameRows).toHaveLength(4);

      const nearest = await profileGamesRepository.findNearestCompletions(profile.id, 10);
      const nearestGameIds = nearest.map((row) => row.gameId);
      expect(nearestGameIds).toContain(nearGame.id);
      expect(nearestGameIds).toContain(zeroUnlockedGame.id);
      expect(nearestGameIds).not.toContain(zeroAchievementGame.id);
      expect(nearestGameIds).not.toContain(completedGame.id);

      await expect(profileGamesRepository.getProfileGameSummary(emptyProfile.id)).resolves.toEqual({
        totalGames: 0,
        completedGames: 0,
        totalAchievements: 0,
        unlockedAchievements: 0,
      });

      await expect(profileGamesRepository.getProfileGameSummary(profile.id)).resolves.toEqual({
        totalGames: 4,
        completedGames: 1,
        totalAchievements: 22,
        unlockedAchievements: 14,
      });
    });
  });

  describe('AchievementsRepository', () => {
    it('upserts achievement metadata and finds achievements by app/API name', async () => {
      const identity = createIdentity();

      const created = await achievementsRepository.upsertAchievement({
        steamAppId: identity.appId,
        apiName: 'TEST_ONE',
        displayName: 'Initial Achievement',
        globalPercentage: 20.5,
      });

      const updated = await achievementsRepository.upsertAchievement({
        steamAppId: identity.appId,
        apiName: 'TEST_ONE',
        displayName: 'Updated Achievement',
        globalPercentage: 10.125,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.displayName).toBe('Updated Achievement');
      expect(updated.globalPercentage).toBe(10.125);

      await achievementsRepository.upsertAchievement({
        steamAppId: identity.appId,
        apiName: 'TEST_TWO',
        displayName: 'Second Achievement',
      });

      await expect(
        achievementsRepository.findBySteamAppIdAndApiName(identity.appId, 'TEST_ONE'),
      ).resolves.toMatchObject({ id: created.id });
      await expect(
        achievementsRepository.findBySteamAppIdAndApiName(identity.appId, 'MISSING'),
      ).resolves.toBeNull();

      const appAchievements = await achievementsRepository.findByGameSteamAppId(identity.appId);
      expect(appAchievements.map((achievement) => achievement.apiName)).toEqual([
        'TEST_ONE',
        'TEST_TWO',
      ]);
    });
  });

  describe('ProfileAchievementsRepository', () => {
    it('upserts unlock state, finds unlocked rows, and orders rare unlocked achievements', async () => {
      const identity = createIdentity();
      const profile = await createProfile(identity, 'Achievement Profile');
      const rare = await createAchievement(identity.appId, 'RARE', 1.5);
      const common = await createAchievement(identity.appId, 'COMMON', 50);
      const nullRarity = await createAchievement(identity.appId, 'NULL_RARITY', null);
      const locked = await createAchievement(identity.appId, 'LOCKED', 0.5);

      const created = await profileAchievementsRepository.upsertProfileAchievement({
        profileId: profile.id,
        achievementId: rare.id,
        achieved: false,
      });

      const updated = await profileAchievementsRepository.upsertProfileAchievement({
        profileId: profile.id,
        achievementId: rare.id,
        achieved: true,
        unlockedAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      expect(updated.id).toBe(created.id);
      expect(updated.achieved).toBe(true);

      await profileAchievementsRepository.upsertProfileAchievement({
        profileId: profile.id,
        achievementId: common.id,
        achieved: true,
        unlockedAt: new Date('2026-01-02T00:00:00.000Z'),
      });
      await profileAchievementsRepository.upsertProfileAchievement({
        profileId: profile.id,
        achievementId: nullRarity.id,
        achieved: true,
      });
      await profileAchievementsRepository.upsertProfileAchievement({
        profileId: profile.id,
        achievementId: locked.id,
        achieved: false,
      });

      await expect(
        profileAchievementsRepository.findByProfileAndAchievement(profile.id, rare.id),
      ).resolves.toMatchObject({ id: created.id, achieved: true });

      const unlocked = await profileAchievementsRepository.findUnlockedByProfile(profile.id);
      expect(unlocked).toHaveLength(3);
      expect(unlocked.every((row) => row.achieved)).toBe(true);

      const rarest = await profileAchievementsRepository.findRarestUnlockedByProfile(
        profile.id,
        10,
      );
      expect(rarest.map((row) => row.achievement.apiName)).toEqual(['RARE', 'COMMON']);
    });
  });

  describe('AchievementSyncRepository', () => {
    it('upserts achievement metadata without refreshing profile progress', async () => {
      const identity = createIdentity();
      const profile = await createProfile(identity, 'Metadata Only Profile');
      const game = await gamesRepository.upsertGame({
        steamAppId: identity.appId,
        name: 'Metadata Only Game',
        hasAchievements: false,
      });
      const existingAchievement = await createAchievement(
        identity.appId,
        'ACH_EXISTING',
        50,
      );

      await profileGamesRepository.upsertProfileGame({
        profileId: profile.id,
        gameId: game.id,
        totalAchievements: 5,
        unlockedAchievements: 2,
        completionPercentage: 40,
      });
      await profileAchievementsRepository.upsertProfileAchievement({
        profileId: profile.id,
        achievementId: existingAchievement.id,
        achieved: true,
        unlockedAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      const result = await achievementSyncRepository.applyGameAchievementMetadata({
        steamAppId: identity.appId,
        achievements: [
          createSyncedAchievement('ACH_EXISTING'),
          {
            ...createSyncedAchievement('ACH_NEW'),
            globalPercentage: 12.3,
          },
        ],
      });

      expect(result).toEqual({ achievementsSynced: 2 });
      await expect(gamesRepository.findById(game.id)).resolves.toMatchObject({
        hasAchievements: true,
      });
      await expect(
        achievementsRepository.findBySteamAppIdAndApiName(
          identity.appId,
          'ACH_NEW',
        ),
      ).resolves.toMatchObject({
        globalPercentage: 12.3,
      });
      await expect(
        profileAchievementsRepository.findByProfileAndAchievement(
          profile.id,
          existingAchievement.id,
        ),
      ).resolves.toMatchObject({ achieved: true });
      await expect(
        profileGamesRepository.findProfileGameBySteamAppId(
          profile.id,
          identity.appId,
        ),
      ).resolves.toMatchObject({
        profileGame: {
          totalAchievements: 5,
          unlockedAchievements: 2,
          completionPercentage: 40,
        },
      });
    });

    it('uses the PostgreSQL function to refresh partial and full progress', async () => {
      const identity = createIdentity();
      const profile = await createProfile(identity, 'Achievement Sync Profile');
      const game = await createGame(identity.appId, 'Function Game');

      await profileGamesRepository.upsertProfileGame({
        profileId: profile.id,
        gameId: game.id,
        totalAchievements: 0,
        unlockedAchievements: 0,
        completionPercentage: 0,
      });

      const partial = await achievementSyncRepository.applyGameAchievementSync({
        profileId: profile.id,
        steamAppId: identity.appId,
        achievements: [
          createSyncedAchievement('ACH_ONE'),
          createSyncedAchievement('ACH_TWO'),
          createSyncedAchievement('ACH_THREE'),
        ],
        profileAchievements: [
          { apiName: 'ACH_ONE', achieved: true, unlockedAt: null },
          { apiName: 'ACH_TWO', achieved: false, unlockedAt: null },
          { apiName: 'ACH_THREE', achieved: false, unlockedAt: null },
        ],
        lastSyncedAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      expect(partial.progress).toEqual({
        totalAchievements: 3,
        unlockedAchievements: 1,
        completionPercentage: 33.33,
      });

      await expect(gamesRepository.findById(game.id)).resolves.toMatchObject({
        hasAchievements: true,
      });
      await expect(
        profileGamesRepository.findProfileGameBySteamAppId(
          profile.id,
          identity.appId,
        ),
      ).resolves.toMatchObject({
        profileGame: {
          totalAchievements: 3,
          unlockedAchievements: 1,
          completionPercentage: 33.33,
        },
      });

      const full = await achievementSyncRepository.applyGameAchievementSync({
        profileId: profile.id,
        steamAppId: identity.appId,
        achievements: [
          createSyncedAchievement('ACH_ONE'),
          createSyncedAchievement('ACH_TWO'),
          createSyncedAchievement('ACH_THREE'),
        ],
        profileAchievements: [
          { apiName: 'ACH_ONE', achieved: true, unlockedAt: null },
          { apiName: 'ACH_TWO', achieved: true, unlockedAt: null },
          { apiName: 'ACH_THREE', achieved: true, unlockedAt: null },
        ],
        lastSyncedAt: new Date('2026-01-02T00:00:00.000Z'),
      });

      expect(full.progress).toEqual({
        totalAchievements: 3,
        unlockedAchievements: 3,
        completionPercentage: 100,
      });
    });

    it('uses the PostgreSQL function to mark zero-achievement games', async () => {
      const identity = createIdentity();
      const profile = await createProfile(identity, 'Zero Achievement Sync Profile');
      const game = await createGame(identity.appId, 'Zero Function Game');

      await profileGamesRepository.upsertProfileGame({
        profileId: profile.id,
        gameId: game.id,
        totalAchievements: 5,
        unlockedAchievements: 5,
        completionPercentage: 100,
      });

      const result = await achievementSyncRepository.applyGameAchievementSync({
        profileId: profile.id,
        steamAppId: identity.appId,
        achievements: [],
        profileAchievements: [],
        lastSyncedAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      expect(result.progress).toEqual({
        totalAchievements: 0,
        unlockedAchievements: 0,
        completionPercentage: 0,
      });
      await expect(gamesRepository.findById(game.id)).resolves.toMatchObject({
        hasAchievements: false,
      });
    });
  });

  describe('SyncRunsRepository', () => {
    it('creates and updates sync runs and finds latest runs newest first', async () => {
      const identity = createIdentity();
      const profile = await createProfile(identity, 'Sync Profile');

      const queued = await syncRunsRepository.createRun({
        profileId: profile.id,
        syncType: 'full',
      });
      expect(queued.status).toBe('queued');

      const running = await syncRunsRepository.markRunning(queued.id);
      expect(running).toMatchObject({ id: queued.id, status: 'running' });
      expect(running?.finishedAt).toBeNull();

      const success = await syncRunsRepository.markSuccess(queued.id, {
        gamesSynced: 1,
      });
      expect(success?.status).toBe('success');
      expect(success?.finishedAt).toBeInstanceOf(Date);
      expect(success?.metadata).toEqual({ gamesSynced: 1 });

      const partial = await syncRunsRepository.createRun({
        profileId: profile.id,
        syncType: 'achievements',
        status: 'running',
      });
      const partialUpdated = await syncRunsRepository.markPartialSuccess(
        partial.id,
        'Some games skipped',
        { skippedGames: 2 },
      );
      expect(partialUpdated?.status).toBe('partial_success');
      expect(partialUpdated?.finishedAt).toBeInstanceOf(Date);
      expect(partialUpdated?.errorMessage).toBe('Some games skipped');
      expect(partialUpdated?.metadata).toEqual({ skippedGames: 2 });

      const failed = await syncRunsRepository.createRun({
        profileId: profile.id,
        syncType: 'games',
        status: 'running',
      });
      const failedUpdated = await syncRunsRepository.markFailed(
        failed.id,
        'Steam timeout',
        { retryable: true },
      );
      expect(failedUpdated?.status).toBe('failed');
      expect(failedUpdated?.finishedAt).toBeInstanceOf(Date);
      expect(failedUpdated?.errorMessage).toBe('Steam timeout');
      expect(failedUpdated?.metadata).toEqual({ retryable: true });

      const latest = await syncRunsRepository.findLatestByProfile(profile.id, 3);
      expect(latest).toHaveLength(3);
      expect(latest[0].startedAt.getTime()).toBeGreaterThanOrEqual(
        latest[1].startedAt.getTime(),
      );
      expect(latest[1].startedAt.getTime()).toBeGreaterThanOrEqual(
        latest[2].startedAt.getTime(),
      );

      await expect(syncRunsRepository.findById(queued.id)).resolves.toMatchObject({
        id: queued.id,
      });
      await expect(syncRunsRepository.findById(randomUUID())).resolves.toBeNull();
    });
  });

  describe('Auth foundation repositories', () => {
    it('persists Steam callback auth state and session atomically', async () => {
      const identity = createIdentity();
      const result = await authCallbackRepository.persistSteamLogin({
        steamId: identity.steamId,
        profile: createAuthProfile('Integration Callback User'),
        session: createAuthSessionInput('callback-session-hash-1'),
      });

      expect(result).toMatchObject({
        steamId: identity.steamId,
        personaName: 'Integration Callback User',
      });
      await expect(
        userSteamAccountsRepository.findBySteamId(identity.steamId),
      ).resolves.toMatchObject({
        userId: result.userId,
        steamProfileId: result.steamProfileId,
        isPrimary: true,
      });
      await expect(userPreferencesRepository.findByUserId(result.userId)).resolves.toMatchObject({
        userId: result.userId,
      });
      await expect(
        publicProfilesRepository.findByUserAndProfileId(
          result.userId,
          result.steamProfileId,
        ),
      ).resolves.toMatchObject({
        userId: result.userId,
        steamProfileId: result.steamProfileId,
      });

      const sessionRows = await databaseService.db
        .select({ id: authSessions.id })
        .from(authSessions)
        .where(eq(authSessions.userId, result.userId));
      expect(sessionRows).toHaveLength(1);
    });

    it('rolls back user and account rows if session persistence fails', async () => {
      const firstIdentity = createIdentity();
      const secondIdentity = createIdentity();
      const duplicateSessionHash = 'callback-duplicate-session-hash';

      await authCallbackRepository.persistSteamLogin({
        steamId: firstIdentity.steamId,
        profile: createAuthProfile('Integration Callback Existing User'),
        session: createAuthSessionInput(duplicateSessionHash),
      });

      await expect(
        authCallbackRepository.persistSteamLogin({
          steamId: secondIdentity.steamId,
          profile: createAuthProfile('Integration Callback Rolled Back User'),
          session: createAuthSessionInput(duplicateSessionHash),
        }),
      ).rejects.toThrow();

      await expect(
        userSteamAccountsRepository.findBySteamId(secondIdentity.steamId),
      ).resolves.toBeNull();
      await expect(
        steamProfilesRepository.findBySteamId(secondIdentity.steamId),
      ).resolves.toBeNull();

      const rolledBackUsers = await databaseService.db
        .select({ id: appUsers.id })
        .from(appUsers)
        .where(eq(appUsers.displayName, 'Integration Callback Rolled Back User'));
      expect(rolledBackUsers).toHaveLength(0);
    });

    it('reuses an existing linked account on repeated Steam login', async () => {
      const identity = createIdentity();
      const first = await authCallbackRepository.persistSteamLogin({
        steamId: identity.steamId,
        profile: createAuthProfile('Integration Callback Reused User'),
        session: createAuthSessionInput('callback-session-hash-reused-1'),
      });
      const second = await authCallbackRepository.persistSteamLogin({
        steamId: identity.steamId,
        profile: createAuthProfile('Integration Callback Reused User Updated'),
        session: createAuthSessionInput('callback-session-hash-reused-2'),
      });

      expect(second.userId).toBe(first.userId);
      expect(second.steamProfileId).toBe(first.steamProfileId);

      const accounts = await userSteamAccountsRepository.findForUser(first.userId);
      expect(accounts.filter((account) => account.steamId === identity.steamId)).toHaveLength(1);

      const sessionRows = await databaseService.db
        .select({ id: authSessions.id })
        .from(authSessions)
        .where(eq(authSessions.userId, first.userId));
      expect(sessionRows).toHaveLength(2);
    });

    it('links a Steam account and moves the primary flag without invalid SQL', async () => {
      const identity = createIdentity();
      const secondaryIdentity = createIdentity();
      const profile = await createProfile(identity, 'Integration Auth Primary Profile');
      const secondaryProfile = await createProfile(
        secondaryIdentity,
        'Integration Auth Secondary Profile',
      );
      const user = await appUsersRepository.create({
        displayName: 'Integration Auth User',
        avatarUrl: null,
      });

      const firstAccount = await userSteamAccountsRepository.upsertByUserAndProfile({
        userId: user.id,
        steamProfileId: profile.id,
        steamId: identity.steamId,
      });

      expect(firstAccount).toMatchObject({
        userId: user.id,
        steamProfileId: profile.id,
        steamId: identity.steamId,
        isPrimary: true,
      });

      const secondAccount = await userSteamAccountsRepository.upsertByUserAndProfile({
        userId: user.id,
        steamProfileId: secondaryProfile.id,
        steamId: secondaryIdentity.steamId,
      });

      expect(secondAccount).toMatchObject({
        userId: user.id,
        steamProfileId: secondaryProfile.id,
        isPrimary: true,
      });

      await expect(
        userSteamAccountsRepository.findPrimaryByUserId(user.id),
      ).resolves.toMatchObject({
        steamProfileId: secondaryProfile.id,
      });
      await expect(
        userSteamAccountsRepository.findBySteamId(identity.steamId),
      ).resolves.toMatchObject({
        isPrimary: false,
      });

      await expect(userPreferencesRepository.create(user.id)).resolves.toMatchObject({
        userId: user.id,
      });
      await expect(
        publicProfilesRepository.create({
          userId: user.id,
          steamProfileId: secondaryProfile.id,
        }),
      ).resolves.toMatchObject({
        userId: user.id,
        steamProfileId: secondaryProfile.id,
      });
    });
  });
});

function createIdentity(): TestIdentity {
  const suffix = randomUUID();
  const numericSuffix = Number.parseInt(suffix.replace(/-/g, '').slice(0, 6), 16);

  return {
    suffix,
    steamId: `${testSteamIdPrefix}${suffix}`,
    appId: testAppIdBase + (numericSuffix % 100_000_000),
  };
}

async function createProfile(
  identity: TestIdentity,
  personaName: string,
): Promise<SteamProfile> {
  return steamProfilesRepository.upsertProfile({
    steamId: identity.steamId,
    personaName,
    visibilityState: 3,
    isPrivate: false,
  });
}

async function createGame(steamAppId: number, name: string): Promise<Game> {
  return gamesRepository.upsertGame({
    steamAppId,
    name,
    hasAchievements: true,
  });
}

async function createAchievement(
  steamAppId: number,
  apiName: string,
  globalPercentage: number | null,
) {
  return achievementsRepository.upsertAchievement({
    steamAppId,
    apiName,
    displayName: apiName,
    globalPercentage,
  });
}

function createSyncedAchievement(apiName: string) {
  return {
    apiName,
    displayName: apiName,
    description: `${apiName} description`,
    iconUrl: null,
    iconGrayUrl: null,
    globalPercentage: null,
    hidden: false,
  };
}

function createAuthProfile(personaName: string) {
  return {
    personaName,
    avatarUrl: 'https://avatars.example/auth-callback.jpg',
    profileUrl: 'https://steamcommunity.com/profiles/76561198000000000',
    visibilityState: 3,
  };
}

function createAuthSessionInput(sessionTokenHash: string) {
  return {
    sessionTokenHash,
    userAgent: 'integration-test',
    ipAddress: '127.0.0.1',
    expiresAt: new Date('2030-01-01T00:00:00.000Z'),
  };
}

async function cleanupTestData(): Promise<void> {
  const testProfiles = databaseService.db
    .select({ id: steamProfiles.id })
    .from(steamProfiles)
    .where(like(steamProfiles.steamId, `${testSteamIdPrefix}%`));
  const testGames = databaseService.db
    .select({ id: games.id })
    .from(games)
    .where(gte(games.steamAppId, testAppIdBase));
  const testAchievements = databaseService.db
    .select({ id: achievements.id })
    .from(achievements)
    .where(gte(achievements.steamAppId, testAppIdBase));

  await databaseService.db
    .delete(syncRuns)
    .where(sql`${syncRuns.profileId} IN ${testProfiles}`);
  await databaseService.db
    .delete(authSessions)
    .where(
      sql`${authSessions.userId} IN (
        select ${appUsers.id}
        from ${appUsers}
        where ${appUsers.displayName} like 'Integration Auth%'
          or ${appUsers.displayName} like 'Integration Callback%'
      )`,
    );
  await databaseService.db
    .delete(profileAchievements)
    .where(
      sql`${profileAchievements.profileId} IN ${testProfiles}
        OR ${profileAchievements.achievementId} IN ${testAchievements}`,
    );
  await databaseService.db
    .delete(profileGames)
    .where(
      sql`${profileGames.profileId} IN ${testProfiles}
        OR ${profileGames.gameId} IN ${testGames}`,
    );
  await databaseService.db
    .delete(achievements)
    .where(gte(achievements.steamAppId, testAppIdBase));
  await databaseService.db
    .delete(games)
    .where(gte(games.steamAppId, testAppIdBase));
  await databaseService.db
    .delete(publicProfiles)
    .where(
      sql`${publicProfiles.steamProfileId} IN ${testProfiles}
        OR ${publicProfiles.userId} IN (
          select ${appUsers.id}
          from ${appUsers}
          where ${appUsers.displayName} like 'Integration Auth%'
            or ${appUsers.displayName} like 'Integration Callback%'
        )`,
    );
  await databaseService.db
    .delete(userPreferences)
    .where(
      sql`${userPreferences.userId} IN (
        select ${appUsers.id}
        from ${appUsers}
        where ${appUsers.displayName} like 'Integration Auth%'
          or ${appUsers.displayName} like 'Integration Callback%'
      )`,
    );
  await databaseService.db
    .delete(userSteamAccounts)
    .where(
      sql`${userSteamAccounts.steamProfileId} IN ${testProfiles}
        OR ${userSteamAccounts.userId} IN (
          select ${appUsers.id}
          from ${appUsers}
          where ${appUsers.displayName} like 'Integration Auth%'
            or ${appUsers.displayName} like 'Integration Callback%'
        )`,
    );
  await databaseService.db
    .delete(appUsers)
    .where(
      sql`${appUsers.displayName} like 'Integration Auth%'
        or ${appUsers.displayName} like 'Integration Callback%'`,
    );
  await databaseService.db
    .delete(steamProfiles)
    .where(like(steamProfiles.steamId, `${testSteamIdPrefix}%`));
}
