import { and, eq, inArray, or, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import {
  achievements,
  games,
  profileAchievements,
  profileGames,
  profileSnapshots,
  steamProfiles,
  syncRuns,
} from './schema';
import * as schema from './schema';
import type { SyncRunMetadata } from './schema';

const DEMO_STEAM_ID = '76561198000000000';
const DEMO_NOW = new Date();
const DEMO_PROFILE_URL = `https://steamcommunity.com/profiles/${DEMO_STEAM_ID}`;
const DEMO_AVATAR_URL = 'https://placehold.co/184x184?text=Demo';
const DEMO_SYNC_RUN_IDS = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
];

interface AchievementSeed {
  apiName: string;
  displayName: string;
  description: string;
  globalPercentage: number | null;
  hidden?: boolean;
  achieved: boolean;
  unlockedDaysAgo?: number;
}

interface GameSeed {
  steamAppId: number;
  name: string;
  hasAchievements: boolean;
  playtimeMinutes: number;
  playtimeTwoWeeksMinutes: number;
  lastPlayedDaysAgo: number | null;
  achievements: AchievementSeed[];
}

const GAME_SEEDS: GameSeed[] = [
  {
    steamAppId: 910001,
    name: 'Demo Complete Quest',
    hasAchievements: true,
    playtimeMinutes: 840,
    playtimeTwoWeeksMinutes: 0,
    lastPlayedDaysAgo: 40,
    achievements: [
      achievement('complete-start', 'First Step', 78.2, true, 38),
      achievement('complete-story', 'Story Finished', 42.5, true, 35),
      achievement('complete-collector', 'Collector', 12.8, true, 30),
      achievement('complete-challenge', 'Challenge Cleared', 4.7, true, 25),
      achievement('complete-secret', 'Hidden Ending', 0.7, true, 20, true),
    ],
  },
  {
    steamAppId: 910002,
    name: 'Demo Last Mile',
    hasAchievements: true,
    playtimeMinutes: 1320,
    playtimeTwoWeeksMinutes: 120,
    lastPlayedDaysAgo: 1,
    achievements: [
      achievement('last-mile-start', 'Start the Climb', 82.4, true, 18),
      achievement('last-mile-boss-one', 'First Gate', 54.1, true, 17),
      achievement('last-mile-boss-two', 'Second Gate', 38.3, true, 16),
      achievement('last-mile-boss-three', 'Third Gate', 19.8, true, 15),
      achievement('last-mile-map', 'Map Maker', 8.6, true, 12),
      achievement('last-mile-rare-route', 'Rare Route', 1.2, true, 10),
      achievement('last-mile-speed', 'Almost Perfect', 6.3, true, 8),
      achievement('last-mile-final', 'One Left', 0.9, false, undefined, true),
    ],
  },
  {
    steamAppId: 910003,
    name: 'Demo Balanced Adventure',
    hasAchievements: true,
    playtimeMinutes: 510,
    playtimeTwoWeeksMinutes: 45,
    lastPlayedDaysAgo: 6,
    achievements: [
      achievement('balanced-arrival', 'Arrival', 91.4, true, 12),
      achievement('balanced-crafting', 'Workbench', 60.2, true, 11),
      achievement('balanced-boss', 'First Boss', 33.7, true, 8),
      achievement('balanced-rare-find', 'Rare Find', 2.1, true, 5),
      achievement('balanced-angler', 'Angler', 22.4, false),
      achievement('balanced-cartographer', 'Cartographer', 16.8, false),
      achievement('balanced-arena', 'Arena Victor', 9.2, false),
      achievement('balanced-lore', 'Lore Keeper', 5.4, false),
      achievement('balanced-secret-door', 'Secret Door', 1.6, false, undefined, true),
      achievement('balanced-final', 'Final Chapter', 3.9, false),
    ],
  },
  {
    steamAppId: 910004,
    name: 'Demo Fresh Start',
    hasAchievements: true,
    playtimeMinutes: 0,
    playtimeTwoWeeksMinutes: 0,
    lastPlayedDaysAgo: null,
    achievements: [
      achievement('fresh-open', 'Open the Door', 88.5, false),
      achievement('fresh-first-win', 'First Win', 47.9, false),
      achievement('fresh-combo', 'Combo Starter', 29.3, false),
      achievement('fresh-hidden', 'Hidden Switch', 7.1, false, undefined, true),
      achievement('fresh-perfect', 'Perfect Round', 3.2, false),
      achievement('fresh-master', 'Master Trial', 0.8, false),
    ],
  },
  {
    steamAppId: 910005,
    name: 'Demo Idle Sandbox',
    hasAchievements: false,
    playtimeMinutes: 95,
    playtimeTwoWeeksMinutes: 0,
    lastPlayedDaysAgo: 90,
    achievements: [],
  },
  {
    steamAppId: 910006,
    name: 'Demo Endless Grind',
    hasAchievements: true,
    playtimeMinutes: 12600,
    playtimeTwoWeeksMinutes: 380,
    lastPlayedDaysAgo: 0,
    achievements: [
      achievement('grind-boot', 'Boot Sequence', 76.7, true, 80),
      achievement('grind-level-10', 'Level 10', 58.9, true, 72),
      achievement('grind-level-25', 'Level 25', 37.4, true, 65),
      achievement('grind-level-50', 'Level 50', 18.5, true, 40),
      achievement('grind-crafter', 'Dedicated Crafter', 11.1, true, 33),
      achievement('grind-dungeon', 'Deep Dungeon', 5.8, true, 21),
      achievement('grind-legendary', 'Legendary Drop', 0.4, true, 14),
      achievement('grind-marathon', 'Marathon Session', 2.8, true, 3),
      achievement('grind-raid', 'Raid Captain', 7.7, false),
      achievement('grind-collection', 'Complete Collection', 1.9, false),
      achievement('grind-secret', 'Hidden Contract', null, false, undefined, true),
      achievement('grind-true-end', 'True Ending', 0.6, false),
    ],
  },
];

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to seed development data.');
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });
  const mode = process.argv[2] === 'reset' ? 'reset' : 'seed';

  try {
    if (mode === 'reset') {
      await resetDemoData(db);
      console.log('Development seed data reset complete.');
      return;
    }

    await seedDemoData(db);
    console.log(`Development seed data ready for Steam ID ${DEMO_STEAM_ID}.`);
    console.log(
      `Seeded app IDs: ${GAME_SEEDS.map((game) => game.steamAppId).join(', ')}.`,
    );
  } finally {
    await pool.end();
  }
}

async function seedDemoData(db: ReturnType<typeof drizzle<typeof schema>>): Promise<void> {
  await db.transaction(async (tx) => {
    const [profile] = await tx
      .insert(steamProfiles)
      .values({
        steamId: DEMO_STEAM_ID,
        personaName: 'Demo Achievement Hunter',
        avatarUrl: DEMO_AVATAR_URL,
        profileUrl: DEMO_PROFILE_URL,
        visibilityState: 3,
        isPrivate: false,
        lastSyncedAt: DEMO_NOW,
      })
      .onConflictDoUpdate({
        target: steamProfiles.steamId,
        set: {
          personaName: 'Demo Achievement Hunter',
          avatarUrl: DEMO_AVATAR_URL,
          profileUrl: DEMO_PROFILE_URL,
          visibilityState: 3,
          isPrivate: false,
          lastSyncedAt: DEMO_NOW,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    for (const gameSeed of GAME_SEEDS) {
      const [game] = await tx
        .insert(games)
        .values({
          steamAppId: gameSeed.steamAppId,
          name: gameSeed.name,
          iconUrl: null,
          logoUrl: null,
          hasAchievements: gameSeed.hasAchievements,
        })
        .onConflictDoUpdate({
          target: games.steamAppId,
          set: {
            name: gameSeed.name,
            iconUrl: null,
            logoUrl: null,
            hasAchievements: gameSeed.hasAchievements,
            updatedAt: sql`now()`,
          },
        })
        .returning();

      const unlockedAchievements = gameSeed.achievements.filter(
        (achievementSeed) => achievementSeed.achieved,
      ).length;
      const totalAchievements = gameSeed.achievements.length;

      await tx
        .insert(profileGames)
        .values({
          profileId: profile.id,
          gameId: game.id,
          playtimeMinutes: gameSeed.playtimeMinutes,
          playtimeTwoWeeksMinutes: gameSeed.playtimeTwoWeeksMinutes,
          totalAchievements,
          unlockedAchievements,
          completionPercentage: calculateCompletionPercentage(
            unlockedAchievements,
            totalAchievements,
          ),
          lastPlayedAt: daysAgoOrNull(gameSeed.lastPlayedDaysAgo),
          lastSyncedAt: DEMO_NOW,
        })
        .onConflictDoUpdate({
          target: [profileGames.profileId, profileGames.gameId],
          set: {
            playtimeMinutes: gameSeed.playtimeMinutes,
            playtimeTwoWeeksMinutes: gameSeed.playtimeTwoWeeksMinutes,
            totalAchievements,
            unlockedAchievements,
            completionPercentage: calculateCompletionPercentage(
              unlockedAchievements,
              totalAchievements,
            ),
            lastPlayedAt: daysAgoOrNull(gameSeed.lastPlayedDaysAgo),
            lastSyncedAt: DEMO_NOW,
            updatedAt: sql`now()`,
          },
        });

      for (const achievementSeed of gameSeed.achievements) {
        const [achievementRow] = await tx
          .insert(achievements)
          .values({
            steamAppId: gameSeed.steamAppId,
            apiName: achievementSeed.apiName,
            displayName: achievementSeed.displayName,
            description: achievementSeed.description,
            iconUrl: null,
            iconGrayUrl: null,
            globalPercentage: achievementSeed.globalPercentage,
            hidden: achievementSeed.hidden ?? false,
          })
          .onConflictDoUpdate({
            target: [achievements.steamAppId, achievements.apiName],
            set: {
              displayName: achievementSeed.displayName,
              description: achievementSeed.description,
              iconUrl: null,
              iconGrayUrl: null,
              globalPercentage: achievementSeed.globalPercentage,
              hidden: achievementSeed.hidden ?? false,
              updatedAt: sql`now()`,
            },
          })
          .returning();

        await tx
          .insert(profileAchievements)
          .values({
            profileId: profile.id,
            achievementId: achievementRow.id,
            achieved: achievementSeed.achieved,
            unlockedAt: achievementSeed.achieved
              ? daysAgoOrNull(achievementSeed.unlockedDaysAgo ?? 1)
              : null,
            lastSyncedAt: DEMO_NOW,
          })
          .onConflictDoUpdate({
            target: [
              profileAchievements.profileId,
              profileAchievements.achievementId,
            ],
            set: {
              achieved: achievementSeed.achieved,
              unlockedAt: achievementSeed.achieved
                ? daysAgoOrNull(achievementSeed.unlockedDaysAgo ?? 1)
                : null,
              lastSyncedAt: DEMO_NOW,
              updatedAt: sql`now()`,
            },
          });
      }
    }

    await seedSyncRuns(tx, profile.id);
    await seedSnapshotIfMissing(tx, profile.id);
  });
}

async function resetDemoData(db: ReturnType<typeof drizzle<typeof schema>>): Promise<void> {
  await db.transaction(async (tx) => {
    const profileRows = await tx
      .select({ id: steamProfiles.id })
      .from(steamProfiles)
      .where(eq(steamProfiles.steamId, DEMO_STEAM_ID))
      .limit(1);
    const achievementRows = await tx
      .select({ id: achievements.id })
      .from(achievements)
      .where(inArray(achievements.steamAppId, demoAppIds()));
    const gameRows = await tx
      .select({ id: games.id })
      .from(games)
      .where(inArray(games.steamAppId, demoAppIds()));

    const profileId = profileRows[0]?.id;
    const achievementIds = achievementRows.map((row) => row.id);
    const gameIds = gameRows.map((row) => row.id);

    if (profileId !== undefined) {
      await tx
        .delete(profileSnapshots)
        .where(eq(profileSnapshots.steamProfileId, profileId));

      await tx
        .delete(syncRuns)
        .where(
          or(
            eq(syncRuns.profileId, profileId),
            inArray(syncRuns.id, DEMO_SYNC_RUN_IDS),
          ),
        );

      if (achievementIds.length > 0) {
        await tx
          .delete(profileAchievements)
          .where(
            and(
              eq(profileAchievements.profileId, profileId),
              inArray(profileAchievements.achievementId, achievementIds),
            ),
          );
      }

      if (gameIds.length > 0) {
        await tx
          .delete(profileGames)
          .where(
            and(
              eq(profileGames.profileId, profileId),
              inArray(profileGames.gameId, gameIds),
            ),
          );
      }

      await tx.delete(steamProfiles).where(eq(steamProfiles.id, profileId));
    } else {
      await tx.delete(syncRuns).where(inArray(syncRuns.id, DEMO_SYNC_RUN_IDS));
    }

    await tx
      .delete(achievements)
      .where(
        and(
          inArray(achievements.steamAppId, demoAppIds()),
          sql`not exists (
            select 1 from profile_achievements pa
            where pa.achievement_id = ${achievements.id}
          )`,
        ),
      );
    await tx
      .delete(games)
      .where(
        and(
          inArray(games.steamAppId, demoAppIds()),
          sql`not exists (
            select 1 from profile_games pg
            where pg.game_id = ${games.id}
          )`,
        ),
      );
  });
}

async function seedSnapshotIfMissing(
  tx: Parameters<Parameters<ReturnType<typeof drizzle<typeof schema>>['transaction']>[0]>[0],
  profileId: string,
): Promise<void> {
  const rows = await tx
    .select({ total: sql<number>`cast(count(*) as int)` })
    .from(profileSnapshots)
    .where(eq(profileSnapshots.steamProfileId, profileId));

  if ((rows[0]?.total ?? 0) > 0) {
    return;
  }

  await tx.execute(sql`select create_profile_snapshot(${profileId}, 'manual')`);
}

async function seedSyncRuns(
  tx: Parameters<Parameters<ReturnType<typeof drizzle<typeof schema>>['transaction']>[0]>[0],
  profileId: string,
): Promise<void> {
  const syncRunSeeds: Array<{
    id: string;
    syncType: 'full' | 'achievements' | 'games';
    status: 'success' | 'partial_success' | 'failed';
    startedAt: Date;
    finishedAt: Date;
    errorMessage: string | null;
    metadata: SyncRunMetadata;
  }> = [
    {
      id: DEMO_SYNC_RUN_IDS[0],
      syncType: 'full',
      status: 'success',
      startedAt: hoursAgo(30),
      finishedAt: hoursAgo(29.9),
      errorMessage: null,
      metadata: { seed: 'dev', gamesSeen: 6, achievementsSeen: 41 },
    },
    {
      id: DEMO_SYNC_RUN_IDS[1],
      syncType: 'achievements',
      status: 'partial_success',
      startedAt: hoursAgo(4),
      finishedAt: hoursAgo(3.9),
      errorMessage: 'Demo partial sync: one app returned no achievement schema.',
      metadata: { seed: 'dev', affectedAppIds: [910005] },
    },
    {
      id: DEMO_SYNC_RUN_IDS[2],
      syncType: 'games',
      status: 'failed',
      startedAt: hoursAgo(1),
      finishedAt: hoursAgo(0.95),
      errorMessage: 'Demo failed sync: simulated temporary upstream timeout.',
      metadata: { seed: 'dev', retryable: true },
    },
  ];

  for (const syncRunSeed of syncRunSeeds) {
    await tx
      .insert(syncRuns)
      .values({ ...syncRunSeed, profileId })
      .onConflictDoUpdate({
        target: syncRuns.id,
        set: {
          profileId,
          syncType: syncRunSeed.syncType,
          status: syncRunSeed.status,
          startedAt: syncRunSeed.startedAt,
          finishedAt: syncRunSeed.finishedAt,
          errorMessage: syncRunSeed.errorMessage,
          metadata: syncRunSeed.metadata,
        },
      });
  }
}

function achievement(
  apiName: string,
  displayName: string,
  globalPercentage: number | null,
  achieved: boolean,
  unlockedDaysAgo?: number,
  hidden = false,
): AchievementSeed {
  return {
    apiName,
    displayName,
    description: `Demo achievement: ${displayName}.`,
    globalPercentage,
    hidden,
    achieved,
    unlockedDaysAgo,
  };
}

function calculateCompletionPercentage(unlocked: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((unlocked / total) * 10000) / 100;
}

function daysAgoOrNull(daysAgo: number | null): Date | null {
  if (daysAgo === null) {
    return null;
  }

  return new Date(DEMO_NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number): Date {
  return new Date(DEMO_NOW.getTime() - hours * 60 * 60 * 1000);
}

function demoAppIds(): number[] {
  return GAME_SEEDS.map((game) => game.steamAppId);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown seed error';
  console.error(`Development seed failed: ${message}`);
  process.exitCode = 1;
});
