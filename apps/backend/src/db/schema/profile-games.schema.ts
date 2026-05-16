import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { games } from './games.schema';
import { steamProfiles } from './steam-profiles.schema';

export const profileGames = pgTable(
  'profile_games',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => steamProfiles.id, { onDelete: 'restrict' }),
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'restrict' }),
    playtimeMinutes: integer('playtime_minutes').notNull().default(0),
    playtimeTwoWeeksMinutes: integer('playtime_two_weeks_minutes').notNull().default(0),
    totalAchievements: integer('total_achievements').notNull().default(0),
    unlockedAchievements: integer('unlocked_achievements').notNull().default(0),
    completionPercentage: numeric('completion_percentage', {
      precision: 5,
      scale: 2,
      mode: 'number',
    })
      .notNull()
      .default(0),
    lastPlayedAt: timestamp('last_played_at', { withTimezone: true }),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('profile_games_profile_id_game_id_key').on(table.profileId, table.gameId),
    index('profile_games_profile_id_idx').on(table.profileId),
    index('profile_games_game_id_idx').on(table.gameId),
    index('profile_games_profile_completion_idx').on(
      table.profileId,
      table.completionPercentage,
    ),
    index('profile_games_profile_unlocked_total_idx').on(
      table.profileId,
      table.unlockedAchievements,
      table.totalAchievements,
    ),
    check('profile_games_playtime_minutes_check', sql`${table.playtimeMinutes} >= 0`),
    check(
      'profile_games_playtime_two_weeks_minutes_check',
      sql`${table.playtimeTwoWeeksMinutes} >= 0`,
    ),
    check(
      'profile_games_total_achievements_check',
      sql`${table.totalAchievements} >= 0`,
    ),
    check(
      'profile_games_unlocked_achievements_check',
      sql`${table.unlockedAchievements} >= 0`,
    ),
    check(
      'profile_games_unlocked_not_above_total_check',
      sql`${table.unlockedAchievements} <= ${table.totalAchievements}`,
    ),
    check(
      'profile_games_completion_percentage_check',
      sql`${table.completionPercentage} >= 0 AND ${table.completionPercentage} <= 100`,
    ),
  ],
);

export const profileGamesRelations = relations(profileGames, ({ one }) => ({
  profile: one(steamProfiles, {
    fields: [profileGames.profileId],
    references: [steamProfiles.id],
  }),
  game: one(games, {
    fields: [profileGames.gameId],
    references: [games.id],
  }),
}));
