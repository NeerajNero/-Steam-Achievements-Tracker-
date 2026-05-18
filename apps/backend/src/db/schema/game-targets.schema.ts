import { relations, sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { appUsers } from './app-users.schema';
import { games } from './games.schema';
import { steamProfiles } from './steam-profiles.schema';

export const gameTargets = pgTable(
  'game_targets',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'restrict' }),
    steamProfileId: uuid('steam_profile_id')
      .notNull()
      .references(() => steamProfiles.id, { onDelete: 'restrict' }),
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'restrict' }),
    status: text('status').notNull().default('active'),
    priority: text('priority').notNull().default('medium'),
    notes: text('notes'),
    targetCompletionPercentage: numeric('target_completion_percentage', {
      precision: 5,
      scale: 2,
      mode: 'number',
    }),
    dueDate: date('due_date', { mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('game_targets_user_game_key').on(table.userId, table.gameId),
    index('game_targets_user_status_idx').on(table.userId, table.status),
    index('game_targets_steam_profile_status_idx').on(
      table.steamProfileId,
      table.status,
    ),
    index('game_targets_game_id_idx').on(table.gameId),
    index('game_targets_priority_idx').on(table.priority),
    index('game_targets_due_date_idx').on(table.dueDate),
    check(
      'game_targets_status_check',
      sql`${table.status} IN ('active', 'paused', 'completed', 'ignored', 'archived')`,
    ),
    check(
      'game_targets_priority_check',
      sql`${table.priority} IN ('low', 'medium', 'high')`,
    ),
    check(
      'game_targets_target_completion_percentage_check',
      sql`${table.targetCompletionPercentage} IS NULL OR (${table.targetCompletionPercentage} >= 0 AND ${table.targetCompletionPercentage} <= 100)`,
    ),
  ],
);

export const gameTargetsRelations = relations(gameTargets, ({ one }) => ({
  user: one(appUsers, {
    fields: [gameTargets.userId],
    references: [appUsers.id],
  }),
  steamProfile: one(steamProfiles, {
    fields: [gameTargets.steamProfileId],
    references: [steamProfiles.id],
  }),
  game: one(games, {
    fields: [gameTargets.gameId],
    references: [games.id],
  }),
}));
