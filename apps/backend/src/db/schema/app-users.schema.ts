import { relations, sql } from 'drizzle-orm';
import { check, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { authSessions } from './auth-sessions.schema';
import { publicProfiles } from './public-profiles.schema';
import { userPreferences } from './user-preferences.schema';
import { userSteamAccounts } from './user-steam-accounts.schema';

export const appUsers = pgTable(
  'app_users',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    role: text('role').notNull().default('user'),
    status: text('status').notNull().default('active'),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('app_users_role_check', sql`${table.role} IN ('user', 'moderator', 'admin')`),
    check(
      'app_users_status_check',
      sql`${table.status} IN ('active', 'disabled', 'deleted')`,
    ),
  ],
);

export const appUsersRelations = relations(appUsers, ({ many, one }) => ({
  steamAccounts: many(userSteamAccounts),
  authSessions: many(authSessions),
  preferences: one(userPreferences, {
    fields: [appUsers.id],
    references: [userPreferences.userId],
  }),
  publicProfiles: many(publicProfiles),
}));
