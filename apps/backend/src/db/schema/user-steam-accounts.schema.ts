import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { appUsers } from './app-users.schema';
import { steamProfiles } from './steam-profiles.schema';

export const userSteamAccounts = pgTable(
  'user_steam_accounts',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'restrict' }),
    steamProfileId: uuid('steam_profile_id')
      .notNull()
      .references(() => steamProfiles.id, { onDelete: 'restrict' }),
    steamId: text('steam_id').notNull(),
    isPrimary: boolean('is_primary').notNull().default(false),
    linkedAt: timestamp('linked_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('user_steam_accounts_user_profile_key').on(
      table.userId,
      table.steamProfileId,
    ),
    uniqueIndex('user_steam_accounts_steam_id_key').on(table.steamId),
    index('user_steam_accounts_user_id_idx').on(table.userId),
    index('user_steam_accounts_steam_profile_id_idx').on(table.steamProfileId),
    index('user_steam_accounts_steam_id_idx').on(table.steamId),
    uniqueIndex('user_steam_accounts_one_primary_per_user_idx')
      .on(table.userId)
      .where(sql`${table.isPrimary} = true`),
  ],
);

export const userSteamAccountsRelations = relations(
  userSteamAccounts,
  ({ one }) => ({
    user: one(appUsers, {
      fields: [userSteamAccounts.userId],
      references: [appUsers.id],
    }),
    steamProfile: one(steamProfiles, {
      fields: [userSteamAccounts.steamProfileId],
      references: [steamProfiles.id],
    }),
  }),
);
