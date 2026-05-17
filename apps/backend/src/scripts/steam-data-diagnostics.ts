import 'reflect-metadata';

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { and, eq, sql } from 'drizzle-orm';
import Redis from 'ioredis';

import { DatabaseModule } from '../db/database.module';
import { DatabaseService } from '../db/database.service';
import {
  achievements,
  games,
  profileAchievements,
  profileGames,
  steamProfiles,
  syncRuns,
} from '../db/schema';
import { getRedisCacheConfigFromEnv } from '../modules/cache/cache.config';
import { SteamModule } from '../modules/steam/steam.module';
import { SteamApiClient } from '../modules/steam/steam-api.client';
import {
  SteamApiConfigError,
  SteamApiNotFoundOrPrivateError,
  SteamApiRateLimitError,
  SteamApiRequestError,
} from '../modules/steam/steam-api.errors';

const DEFAULT_APP_IDS = [550, 203160];

@Module({
  imports: [DatabaseModule, SteamModule],
})
class SteamDataDiagnosticsModule {}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(
    SteamDataDiagnosticsModule,
    {
      abortOnError: false,
      logger: ['error', 'warn'],
    },
  );

  try {
    const steamApiClient = app.get(SteamApiClient);
    const databaseService = app.get(DatabaseService);
    const redis = createRedisClient();

    try {
      await runDiagnostics({
        steamApiClient,
        databaseService,
        redis,
        steamId: options.steamId,
        appIds: options.appIds,
      });
    } finally {
      redis?.disconnect();
    }
  } finally {
    await app.close();
  }
}

async function runDiagnostics(input: {
  steamApiClient: SteamApiClient;
  databaseService: DatabaseService;
  redis: Redis | null;
  steamId: string;
  appIds: number[];
}): Promise<void> {
  console.log(`steamId: ${input.steamId}`);
  console.log(`selectedAchievementAppIds: ${input.appIds.join(',')}`);

  const [ownedGames, recentGames] = await Promise.all([
    input.steamApiClient.getOwnedGames(input.steamId),
    input.steamApiClient
      .getRecentlyPlayedGames({ steamId: input.steamId, count: 50 })
      .catch(() => []),
  ]);

  console.log(`ownedGames.normalizedCount: ${ownedGames.length}`);
  console.log(
    `ownedGames.withPlaytimeCount: ${
      ownedGames.filter((game) => game.playtimeMinutes > 0).length
    }`,
  );
  console.log(
    `ownedGames.withTwoWeekPlaytimeCount: ${
      ownedGames.filter((game) => game.playtimeTwoWeeksMinutes > 0).length
    }`,
  );
  console.log(`recentGames.normalizedCount: ${recentGames.length}`);

  const profile = await findProfile(input.databaseService, input.steamId);
  const latestSyncRun = await findLatestSyncRun(input.databaseService, profile?.id);
  console.log(`db.profileStored: ${profile === null ? 'false' : 'true'}`);
  console.log(`db.latestSyncStatus: ${latestSyncRun?.status ?? 'none'}`);

  const counts = await getDbCounts(input.databaseService, profile?.id ?? null);
  console.log(`db.gamesCount: ${counts.gamesCount}`);
  console.log(`db.profileGamesCount: ${counts.profileGamesCount}`);
  console.log(`db.achievementsCount: ${counts.achievementsCount}`);
  console.log(`db.profileAchievementsCount: ${counts.profileAchievementsCount}`);
  console.log(`db.profileGamesWithPlaytimeCount: ${counts.profileGamesWithPlaytimeCount}`);
  console.log(
    `db.profileGamesWithTwoWeekPlaytimeCount: ${counts.profileGamesWithTwoWeekPlaytimeCount}`,
  );

  await reportCachePresence(input.redis, input.steamId, input.appIds);

  for (const appId of input.appIds) {
    await reportAppDiagnostics(input, profile?.id ?? null, appId);
  }
}

async function reportAppDiagnostics(
  input: {
    steamApiClient: SteamApiClient;
    databaseService: DatabaseService;
    steamId: string;
  },
  profileId: string | null,
  appId: number,
): Promise<void> {
  console.log(`app.${appId}.start: true`);

  const schema = await input.steamApiClient
    .getSchemaForGame({ appId, language: 'english' })
    .then((value) => ({ count: value.achievements.length, reason: 'ok' }))
    .catch((error: unknown) => ({ count: 0, reason: toSafeSteamReason(error) }));
  const global = await input.steamApiClient
    .getGlobalAchievementPercentages(appId)
    .then((value) => ({ count: value.length, reason: 'ok' }))
    .catch((error: unknown) => ({ count: 0, reason: toSafeSteamReason(error) }));
  const player = await input.steamApiClient
    .getPlayerAchievements({ steamId: input.steamId, appId, language: 'english' })
    .then((value) => ({
      count: value.achievements.length,
      reason: value.isPrivateOrUnavailable ? 'player_unlock_state_unavailable' : 'ok',
    }))
    .catch((error: unknown) => ({
      count: 0,
      reason: toSafeSteamReason(error),
    }));
  const persisted = await getPersistedAppCounts(
    input.databaseService,
    profileId,
    appId,
  );

  console.log(`app.${appId}.schemaCount: ${schema.count}`);
  console.log(`app.${appId}.schemaStatus: ${schema.reason}`);
  console.log(`app.${appId}.globalPercentageCount: ${global.count}`);
  console.log(`app.${appId}.globalPercentageStatus: ${global.reason}`);
  console.log(`app.${appId}.playerAchievementCount: ${player.count}`);
  console.log(`app.${appId}.playerAchievementStatus: ${player.reason}`);
  console.log(`app.${appId}.dbAchievementsCount: ${persisted.achievementsCount}`);
  console.log(
    `app.${appId}.dbProfileAchievementsCount: ${persisted.profileAchievementsCount}`,
  );
  console.log(
    `app.${appId}.dbProfileGameProgress: total=${persisted.totalAchievements} unlocked=${persisted.unlockedAchievements} completion=${persisted.completionPercentage}`,
  );
}

async function findProfile(
  databaseService: DatabaseService,
  steamId: string,
): Promise<{ id: string } | null> {
  const rows = await databaseService.db
    .select({ id: steamProfiles.id })
    .from(steamProfiles)
    .where(eq(steamProfiles.steamId, steamId))
    .limit(1);

  return rows[0] ?? null;
}

async function findLatestSyncRun(
  databaseService: DatabaseService,
  profileId: string | undefined,
): Promise<{ status: string } | null> {
  if (profileId === undefined) {
    return null;
  }

  const rows = await databaseService.db
    .select({ status: syncRuns.status })
    .from(syncRuns)
    .where(eq(syncRuns.profileId, profileId))
    .orderBy(sql`${syncRuns.createdAt} desc`)
    .limit(1);

  return rows[0] ?? null;
}

async function getDbCounts(
  databaseService: DatabaseService,
  profileId: string | null,
): Promise<Record<string, number>> {
  const [gamesCount, achievementsCount, profileGamesSummary, profileAchievementsCount] =
    await Promise.all([
      countRows(databaseService, games),
      countRows(databaseService, achievements),
      profileId === null
        ? Promise.resolve({
            profileGamesCount: 0,
            profileGamesWithPlaytimeCount: 0,
            profileGamesWithTwoWeekPlaytimeCount: 0,
          })
        : countProfileGames(databaseService, profileId),
      profileId === null
        ? Promise.resolve(0)
        : countProfileAchievements(databaseService, profileId),
    ]);

  return {
    gamesCount,
    achievementsCount,
    profileAchievementsCount,
    ...profileGamesSummary,
  };
}

async function countRows(
  databaseService: DatabaseService,
  table: typeof games | typeof achievements,
): Promise<number> {
  const rows = await databaseService.db
    .select({ total: sql<number>`cast(count(*) as int)` })
    .from(table);

  return rows[0]?.total ?? 0;
}

async function countProfileGames(
  databaseService: DatabaseService,
  profileId: string,
): Promise<{
  profileGamesCount: number;
  profileGamesWithPlaytimeCount: number;
  profileGamesWithTwoWeekPlaytimeCount: number;
}> {
  const rows = await databaseService.db
    .select({
      profileGamesCount: sql<number>`cast(count(*) as int)`,
      profileGamesWithPlaytimeCount: sql<number>`cast(count(*) filter (where ${profileGames.playtimeMinutes} > 0) as int)`,
      profileGamesWithTwoWeekPlaytimeCount: sql<number>`cast(count(*) filter (where ${profileGames.playtimeTwoWeeksMinutes} > 0) as int)`,
    })
    .from(profileGames)
    .where(eq(profileGames.profileId, profileId));

  return (
    rows[0] ?? {
      profileGamesCount: 0,
      profileGamesWithPlaytimeCount: 0,
      profileGamesWithTwoWeekPlaytimeCount: 0,
    }
  );
}

async function countProfileAchievements(
  databaseService: DatabaseService,
  profileId: string,
): Promise<number> {
  const rows = await databaseService.db
    .select({ total: sql<number>`cast(count(*) as int)` })
    .from(profileAchievements)
    .where(eq(profileAchievements.profileId, profileId));

  return rows[0]?.total ?? 0;
}

async function getPersistedAppCounts(
  databaseService: DatabaseService,
  profileId: string | null,
  appId: number,
): Promise<{
  achievementsCount: number;
  profileAchievementsCount: number;
  totalAchievements: number;
  unlockedAchievements: number;
  completionPercentage: number;
}> {
  const achievementRows = await databaseService.db
    .select({ total: sql<number>`cast(count(*) as int)` })
    .from(achievements)
    .where(eq(achievements.steamAppId, appId));

  if (profileId === null) {
    return {
      achievementsCount: achievementRows[0]?.total ?? 0,
      profileAchievementsCount: 0,
      totalAchievements: 0,
      unlockedAchievements: 0,
      completionPercentage: 0,
    };
  }

  const [profileAchievementRows, progressRows] = await Promise.all([
    databaseService.db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(profileAchievements)
      .innerJoin(achievements, eq(profileAchievements.achievementId, achievements.id))
      .where(
        and(
          eq(profileAchievements.profileId, profileId),
          eq(achievements.steamAppId, appId),
        ),
      ),
    databaseService.db
      .select({
        totalAchievements: profileGames.totalAchievements,
        unlockedAchievements: profileGames.unlockedAchievements,
        completionPercentage: profileGames.completionPercentage,
      })
      .from(profileGames)
      .innerJoin(games, eq(profileGames.gameId, games.id))
      .where(and(eq(profileGames.profileId, profileId), eq(games.steamAppId, appId)))
      .limit(1),
  ]);
  const progress = progressRows[0];

  return {
    achievementsCount: achievementRows[0]?.total ?? 0,
    profileAchievementsCount: profileAchievementRows[0]?.total ?? 0,
    totalAchievements: progress?.totalAchievements ?? 0,
    unlockedAchievements: progress?.unlockedAchievements ?? 0,
    completionPercentage: progress?.completionPercentage ?? 0,
  };
}

async function reportCachePresence(
  redis: Redis | null,
  steamId: string,
  appIds: number[],
): Promise<void> {
  if (redis === null) {
    console.log('cache.enabled: false');
    return;
  }

  const cacheConfig = getRedisCacheConfigFromEnv();
  const keys = [
    `${cacheConfig.namespace}:owned-games:${steamId}`,
    `${cacheConfig.namespace}:recent-games:${steamId}:50`,
    ...appIds.flatMap((appId) => [
      `${cacheConfig.namespace}:schema:${appId}:english`,
      `${cacheConfig.namespace}:global-achievements:${appId}`,
      `${cacheConfig.namespace}:player-achievements:${steamId}:${appId}:english`,
    ]),
  ];

  try {
    await redis.connect();
    for (const key of keys) {
      const exists = await redis.exists(key);
      console.log(`cache.keyPresent.${key}: ${exists === 1 ? 'true' : 'false'}`);
    }
  } catch {
    console.log('cache.checkStatus: unavailable');
  }
}

function createRedisClient(): Redis | null {
  const cacheConfig = getRedisCacheConfigFromEnv();

  if (!cacheConfig.enabled) {
    return null;
  }

  return new Redis({
    host: cacheConfig.redis.host,
    port: cacheConfig.redis.port,
    ...(cacheConfig.redis.password === undefined
      ? {}
      : { password: cacheConfig.redis.password }),
    commandTimeout: 1_000,
    enableOfflineQueue: false,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });
}

function parseOptions(args: string[]): { steamId: string; appIds: number[] } {
  const steamId = args.find((arg) => !arg.startsWith('--'))?.trim();

  if (steamId === undefined || steamId.length === 0) {
    throw new Error('Provide a Steam64 ID.');
  }

  return {
    steamId,
    appIds:
      parseAppIds(getFlagValue(args, '--app-ids')) ?? DEFAULT_APP_IDS,
  };
}

function getFlagValue(args: string[], flag: string): string | undefined {
  const prefix = `${flag}=`;
  const match = args.find((arg) => arg.startsWith(prefix));

  return match === undefined ? undefined : match.slice(prefix.length);
}

function parseAppIds(value: string | undefined): number[] | undefined {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  const appIds = value.split(',').map((part) => Number(part.trim()));

  if (
    appIds.length === 0 ||
    appIds.some((appId) => !Number.isInteger(appId) || appId <= 0)
  ) {
    throw new Error('App IDs must be positive integers.');
  }

  return [...new Set(appIds)];
}

function toSafeSteamReason(error: unknown): string {
  if (error instanceof SteamApiConfigError) {
    return 'steam_api_key_missing';
  }

  if (error instanceof SteamApiRateLimitError) {
    return 'steam_rate_limited';
  }

  if (error instanceof SteamApiNotFoundOrPrivateError) {
    return 'steam_not_found_or_private';
  }

  if (error instanceof SteamApiRequestError) {
    return 'steam_request_failed';
  }

  return 'steam_unexpected_error';
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown Steam diagnostics error';
  console.error(`Steam data diagnostics failed: ${message}`);
  process.exitCode = 1;
});

export {};
