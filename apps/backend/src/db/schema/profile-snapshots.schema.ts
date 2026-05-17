import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { steamProfiles } from './steam-profiles.schema';

export const profileSnapshots = pgTable(
  'profile_snapshots',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    steamProfileId: uuid('steam_profile_id')
      .notNull()
      .references(() => steamProfiles.id, { onDelete: 'restrict' }),
    totalGames: integer('total_games').notNull().default(0),
    completedGames: integer('completed_games').notNull().default(0),
    totalAchievements: integer('total_achievements').notNull().default(0),
    unlockedAchievements: integer('unlocked_achievements').notNull().default(0),
    remainingAchievements: integer('remaining_achievements').notNull().default(0),
    averageCompletionPercentage: numeric('average_completion_percentage', {
      precision: 5,
      scale: 2,
      mode: 'number',
    })
      .notNull()
      .default(0),
    totalPlaytimeMinutes: integer('total_playtime_minutes').notNull().default(0),
    rarestUnlockedGlobalPercentage: numeric(
      'rarest_unlocked_global_percentage',
      {
        precision: 6,
        scale: 3,
        mode: 'number',
      },
    ),
    snapshotReason: text('snapshot_reason').notNull().default('manual'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('profile_snapshots_steam_profile_id_idx').on(table.steamProfileId),
    index('profile_snapshots_created_at_desc_idx').on(table.createdAt.desc()),
    index('profile_snapshots_profile_created_at_desc_idx').on(
      table.steamProfileId,
      table.createdAt.desc(),
    ),
    index('profile_snapshots_average_completion_desc_idx').on(
      table.averageCompletionPercentage.desc(),
    ),
    index('profile_snapshots_completed_games_desc_idx').on(
      table.completedGames.desc(),
    ),
    index('profile_snapshots_unlocked_achievements_desc_idx').on(
      table.unlockedAchievements.desc(),
    ),
    index('profile_snapshots_rarest_unlocked_asc_idx').on(
      table.rarestUnlockedGlobalPercentage.asc(),
    ),
    check('profile_snapshots_total_games_check', sql`${table.totalGames} >= 0`),
    check(
      'profile_snapshots_completed_games_check',
      sql`${table.completedGames} >= 0`,
    ),
    check(
      'profile_snapshots_total_achievements_check',
      sql`${table.totalAchievements} >= 0`,
    ),
    check(
      'profile_snapshots_unlocked_achievements_check',
      sql`${table.unlockedAchievements} >= 0`,
    ),
    check(
      'profile_snapshots_remaining_achievements_check',
      sql`${table.remainingAchievements} >= 0`,
    ),
    check(
      'profile_snapshots_unlocked_not_above_total_check',
      sql`${table.unlockedAchievements} <= ${table.totalAchievements}`,
    ),
    check(
      'profile_snapshots_completed_not_above_total_games_check',
      sql`${table.completedGames} <= ${table.totalGames}`,
    ),
    check(
      'profile_snapshots_average_completion_check',
      sql`${table.averageCompletionPercentage} >= 0 AND ${table.averageCompletionPercentage} <= 100`,
    ),
    check(
      'profile_snapshots_rarest_unlocked_check',
      sql`${table.rarestUnlockedGlobalPercentage} IS NULL OR (${table.rarestUnlockedGlobalPercentage} >= 0 AND ${table.rarestUnlockedGlobalPercentage} <= 100)`,
    ),
    check(
      'profile_snapshots_snapshot_reason_check',
      sql`${table.snapshotReason} IN ('manual', 'sync_completed', 'scheduled')`,
    ),
  ],
);

export const profileSnapshotsRelations = relations(profileSnapshots, ({ one }) => ({
  steamProfile: one(steamProfiles, {
    fields: [profileSnapshots.steamProfileId],
    references: [steamProfiles.id],
  }),
}));
