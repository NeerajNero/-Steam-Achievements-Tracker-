import { relations, sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { achievements } from './achievements.schema';
import { appUsers } from './app-users.schema';
import { steamProfiles } from './steam-profiles.schema';

export const achievementTargets = pgTable(
  'achievement_targets',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'restrict' }),
    steamProfileId: uuid('steam_profile_id')
      .notNull()
      .references(() => steamProfiles.id, { onDelete: 'restrict' }),
    achievementId: uuid('achievement_id')
      .notNull()
      .references(() => achievements.id, { onDelete: 'restrict' }),
    status: text('status').notNull().default('active'),
    priority: text('priority').notNull().default('medium'),
    notes: text('notes'),
    dueDate: date('due_date', { mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('achievement_targets_user_achievement_key').on(
      table.userId,
      table.achievementId,
    ),
    index('achievement_targets_user_status_idx').on(table.userId, table.status),
    index('achievement_targets_steam_profile_status_idx').on(
      table.steamProfileId,
      table.status,
    ),
    index('achievement_targets_achievement_id_idx').on(table.achievementId),
    index('achievement_targets_priority_idx').on(table.priority),
    index('achievement_targets_due_date_idx').on(table.dueDate),
    check(
      'achievement_targets_status_check',
      sql`${table.status} IN ('active', 'paused', 'completed', 'ignored', 'archived')`,
    ),
    check(
      'achievement_targets_priority_check',
      sql`${table.priority} IN ('low', 'medium', 'high')`,
    ),
  ],
);

export const achievementTargetsRelations = relations(
  achievementTargets,
  ({ one }) => ({
    user: one(appUsers, {
      fields: [achievementTargets.userId],
      references: [appUsers.id],
    }),
    steamProfile: one(steamProfiles, {
      fields: [achievementTargets.steamProfileId],
      references: [steamProfiles.id],
    }),
    achievement: one(achievements, {
      fields: [achievementTargets.achievementId],
      references: [achievements.id],
    }),
  }),
);
