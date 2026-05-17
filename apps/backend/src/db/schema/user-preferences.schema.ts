import { relations, sql } from 'drizzle-orm';
import { jsonb, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { appUsers } from './app-users.schema';

export type UserPreferenceSettings = Record<string, unknown>;

export const userPreferences = pgTable(
  'user_preferences',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'restrict' }),
    settings: jsonb('settings')
      .$type<UserPreferenceSettings>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('user_preferences_user_id_key').on(table.userId)],
);

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(appUsers, {
    fields: [userPreferences.userId],
    references: [appUsers.id],
  }),
}));
