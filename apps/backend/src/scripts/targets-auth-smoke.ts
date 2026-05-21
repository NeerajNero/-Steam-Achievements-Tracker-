import 'reflect-metadata';

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { and, asc, eq, inArray, isNull, or } from 'drizzle-orm';

import { DatabaseModule } from '../db/database.module';
import { DatabaseService } from '../db/database.service';
import { AuthCallbackRepository } from '../db/repositories/auth-callback.repository';
import { AuthSessionsRepository } from '../db/repositories/auth-sessions.repository';
import { ProfileAchievementsRepository } from '../db/repositories/profile-achievements.repository';
import { ProfileGamesRepository } from '../db/repositories/profile-games.repository';
import { TargetsRepository } from '../db/repositories/targets.repository';
import { AuthCallbackDataService } from '../db/services/auth-callback-data.service';
import { AuthSessionsDataService } from '../db/services/auth-sessions-data.service';
import { TargetCompletionDataService } from '../db/services/target-completion-data.service';
import {
  achievementTargets,
  achievements,
  games,
  gameTargets,
  profileAchievements,
  steamProfiles,
} from '../db/schema';
import { getAuthConfig } from '../modules/auth/auth.config';
import { SessionService } from '../modules/auth/session.service';

@Module({
  imports: [DatabaseModule],
})
class TargetsAuthSmokeModule {}

const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const DEMO_STEAM_ID = '76561198000000000';
const DEMO_APP_IDS = [910001, 910002, 910003, 910004, 910005, 910006];

interface AccountTarget {
  id: string;
  type: 'game' | 'achievement';
  status: string;
  priority: string;
  game: { steamAppId: number };
  achievement: { id: string; unlockState: string } | null;
}

interface AccountTargetsList {
  items: AccountTarget[];
  total: number;
}

interface DashboardResponse {
  activeTargets: {
    games: AccountTarget[];
    achievements: AccountTarget[];
  };
}

async function main(): Promise<void> {
  const apiBaseUrl = normalizeApiBaseUrl(
    process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL,
  );
  const app = await NestFactory.createApplicationContext(TargetsAuthSmokeModule, {
    abortOnError: false,
    logger: ['error'],
  });
  const databaseService = app.get(DatabaseService);
  const targetCompletionDataService = new TargetCompletionDataService(
    new TargetsRepository(databaseService),
  );
  const sessionService = new SessionService(
    new AuthSessionsDataService(new AuthSessionsRepository(databaseService)),
  );
  const authCallbackDataService = new AuthCallbackDataService(
    new AuthCallbackRepository(databaseService),
  );
  const profileAchievementsRepository = new ProfileAchievementsRepository(
    databaseService,
  );
  const profileGamesRepository = new ProfileGamesRepository(databaseService);
  let sessionToken: string | null = null;

  try {
    const seedData = await assertSeedData(databaseService);
    const preparedSession = sessionService.prepareSession({
      headers: { 'user-agent': 'targets-auth-smoke' },
      ip: '127.0.0.1',
    });
    sessionToken = preparedSession.token;

    const authResult = await authCallbackDataService.persistSteamLogin({
      steamId: DEMO_STEAM_ID,
      profile: {
        personaName: 'Targets Smoke User',
        avatarUrl: null,
        profileUrl: null,
        visibilityState: 3,
      },
      session: {
        sessionTokenHash: preparedSession.sessionTokenHash,
        userAgent: preparedSession.userAgent,
        ipAddress: preparedSession.ipAddress,
        expiresAt: preparedSession.expiresAt,
      },
    });

    const cookieHeader = createCookieHeader(sessionToken);

    const gameTarget = await requestJson<AccountTarget>(
      apiBaseUrl,
      '/account/targets/games',
      {
        method: 'POST',
        cookieHeader,
        body: {
          steamAppId: seedData.steamAppId,
          priority: 'medium',
          notes: 'Targets auth smoke game target.',
          targetCompletionPercentage: 100,
          dueDate: '2026-06-01',
        },
      },
      isAccountTarget,
    );
    const achievementTarget = await requestJson<AccountTarget>(
      apiBaseUrl,
      '/account/targets/achievements',
      {
        method: 'POST',
        cookieHeader,
        body: {
          achievementId: seedData.achievementId,
          priority: 'high',
          notes: 'Targets auth smoke achievement target.',
          dueDate: '2026-06-02',
        },
      },
      isAccountTarget,
    );

    const listedTargets = await requestJson<AccountTargetsList>(
      apiBaseUrl,
      '/account/targets?type=all&limit=20',
      { method: 'GET', cookieHeader },
      isAccountTargetsList,
    );
    assert(
      listedTargets.items.some((target) => target.id === gameTarget.id),
      'Game target was not present in account target list.',
    );
    assert(
      listedTargets.items.some((target) => target.id === achievementTarget.id),
      'Achievement target was not present in account target list.',
    );

    await profileAchievementsRepository.upsertProfileAchievement({
      profileId: seedData.profileId,
      achievementId: seedData.achievementId,
      achieved: true,
      unlockedAt: new Date('2026-05-20T00:00:00.000Z'),
    });
    await profileGamesRepository.upsertProfileGame({
      profileId: seedData.profileId,
      gameId: seedData.gameId,
      totalAchievements: 10,
      unlockedAchievements: 10,
      completionPercentage: 100,
    });
    await targetCompletionDataService.completeActiveAchievementTargetsForProfileGames(
      seedData.profileId,
      [seedData.steamAppId],
    );
    await targetCompletionDataService.completeActiveGameTargetsForProfileGames(
      seedData.profileId,
      [seedData.steamAppId],
    );

    const completedTargets = await requestJson<AccountTargetsList>(
      apiBaseUrl,
      '/account/targets?status=completed&type=all&limit=20',
      { method: 'GET', cookieHeader },
      isAccountTargetsList,
    );
    assert(
      completedTargets.items.some((target) => target.id === gameTarget.id),
      'Completed target list did not include the completed game target.',
    );
    assert(
      completedTargets.items.some((target) => target.id === achievementTarget.id),
      'Completed target list did not include the completed achievement target.',
    );

    const dashboard = await requestJson<DashboardResponse>(
      apiBaseUrl,
      '/dashboard/me',
      { method: 'GET', cookieHeader },
      isDashboardResponse,
    );
    assert(
      dashboard.activeTargets.games.every((target) => target.id !== gameTarget.id),
      'Dashboard still included the completed game target as active.',
    );
    assert(
      dashboard.activeTargets.achievements.every(
        (target) => target.id !== achievementTarget.id,
      ),
      'Dashboard still included the completed achievement target as active.',
    );

    const dbSummary = await getSafeDbSummary(
      databaseService,
      authResult.userId,
      seedData.gameId,
      seedData.achievementId,
    );

    console.log('targets auth smoke: passed');
    console.log(`gameTargetId: ${gameTarget.id}`);
    console.log(`achievementTargetId: ${achievementTarget.id}`);
    console.log(`listed target count: ${listedTargets.total}`);
    console.log(`completed target count: ${completedTargets.total}`);
    console.log(`dashboard active game targets: ${dashboard.activeTargets.games.length}`);
    console.log(
      `dashboard active achievement targets: ${dashboard.activeTargets.achievements.length}`,
    );
    console.log(`db game target count: ${dbSummary.gameTargetCount}`);
    console.log(`db achievement target count: ${dbSummary.achievementTargetCount}`);
  } finally {
    if (sessionToken !== null) {
      await sessionService.revokeSessionByToken(sessionToken);
    }
    await app.close();
  }
}

async function assertSeedData(
  databaseService: DatabaseService,
): Promise<{ profileId: string; gameId: string; steamAppId: number; achievementId: string }> {
  const [profile] = await databaseService.db
    .select({ id: steamProfiles.id })
    .from(steamProfiles)
    .where(eq(steamProfiles.steamId, DEMO_STEAM_ID))
    .limit(1);

  if (profile === undefined) {
    throw new Error('Seed data missing: run pnpm seed:dev before targets:auth-smoke.');
  }

  const [achievement] = await databaseService.db
    .select({ id: achievements.id, steamAppId: achievements.steamAppId })
    .from(achievements)
    .leftJoin(
      profileAchievements,
      and(
        eq(profileAchievements.profileId, profile.id),
        eq(profileAchievements.achievementId, achievements.id),
      ),
    )
    .where(
      and(
        inArray(achievements.steamAppId, DEMO_APP_IDS),
        or(
          isNull(profileAchievements.id),
          eq(profileAchievements.achieved, false),
        ),
      ),
    )
    .orderBy(asc(achievements.apiName))
    .limit(1);

  if (achievement === undefined) {
    throw new Error('Seed data missing: demo apps have no targetable achievements.');
  }

  const [game] = await databaseService.db
    .select({ id: games.id })
    .from(games)
    .where(eq(games.steamAppId, achievement.steamAppId))
    .limit(1);

  if (game === undefined) {
    throw new Error(`Seed data missing: app ${achievement.steamAppId} is not present.`);
  }

  return {
    profileId: profile.id,
    gameId: game.id,
    steamAppId: achievement.steamAppId,
    achievementId: achievement.id,
  };
}

async function getSafeDbSummary(
  databaseService: DatabaseService,
  userId: string,
  gameId: string,
  achievementId: string,
): Promise<{ gameTargetCount: number; achievementTargetCount: number }> {
  const [gameRows, achievementRows] = await Promise.all([
    databaseService.db
      .select({ id: gameTargets.id })
      .from(gameTargets)
      .where(and(eq(gameTargets.userId, userId), eq(gameTargets.gameId, gameId))),
    databaseService.db
      .select({ id: achievementTargets.id })
      .from(achievementTargets)
      .where(
        and(
          eq(achievementTargets.userId, userId),
          eq(achievementTargets.achievementId, achievementId),
        ),
      ),
  ]);

  return {
    gameTargetCount: gameRows.length,
    achievementTargetCount: achievementRows.length,
  };
}

interface RequestOptions {
  method: 'DELETE' | 'GET' | 'PATCH' | 'POST';
  cookieHeader?: string;
  body?: unknown;
}

async function requestJson<T>(
  baseUrl: string,
  path: string,
  options: RequestOptions,
  guard: (value: unknown) => value is T,
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (options.cookieHeader !== undefined) {
    headers.Cookie = options.cookieHeader;
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw new Error(`${options.method} ${path} failed with HTTP ${response.status}.`);
  }

  const body: unknown = await response.json();

  if (!guard(body)) {
    throw new Error(`${options.method} ${path} returned an unexpected body.`);
  }

  return body;
}

function createCookieHeader(token: string): string {
  const cookieName = getAuthConfig().authSessionCookieName;
  return `${encodeURIComponent(cookieName)}=${encodeURIComponent(token)}`;
}

function normalizeApiBaseUrl(value: string): string {
  return value.replace(/\/$/, '');
}

function isAccountTarget(value: unknown): value is AccountTarget {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    (value.type === 'game' || value.type === 'achievement') &&
    typeof value.status === 'string' &&
    typeof value.priority === 'string' &&
    isRecord(value.game) &&
    typeof value.game.steamAppId === 'number' &&
    (value.achievement === null || isRecord(value.achievement))
  );
}

function isAccountTargetsList(value: unknown): value is AccountTargetsList {
  return (
    isRecord(value) &&
    Array.isArray(value.items) &&
    value.items.every(isAccountTarget) &&
    typeof value.total === 'number'
  );
}

function isDashboardResponse(value: unknown): value is DashboardResponse {
  return (
    isRecord(value) &&
    isRecord(value.activeTargets) &&
    Array.isArray(value.activeTargets.games) &&
    value.activeTargets.games.every(isAccountTarget) &&
    Array.isArray(value.activeTargets.achievements) &&
    value.activeTargets.achievements.every(isAccountTarget)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown smoke error.';
  console.error(`targets auth smoke failed: ${message}`);
  process.exitCode = 1;
});

export {};
