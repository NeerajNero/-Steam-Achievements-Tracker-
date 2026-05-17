import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { profileAchievements } from './profile-achievements.schema';
import { profileGames } from './profile-games.schema';
import { profileSnapshots } from './profile-snapshots.schema';
import { publicProfiles } from './public-profiles.schema';
import { syncRuns } from './sync-runs.schema';
import { userSteamAccounts } from './user-steam-accounts.schema';

export const steamProfiles = pgTable(
  'steam_profiles',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    steamId: text('steam_id').notNull(),
    personaName: text('persona_name'),
    avatarUrl: text('avatar_url'),
    profileUrl: text('profile_url'),
    visibilityState: integer('visibility_state'),
    isPrivate: boolean('is_private').notNull().default(false),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('steam_profiles_steam_id_key').on(table.steamId)],
);

export const steamProfilesRelations = relations(steamProfiles, ({ many }) => ({
  profileGames: many(profileGames),
  profileAchievements: many(profileAchievements),
  profileSnapshots: many(profileSnapshots),
  syncRuns: many(syncRuns),
  userSteamAccounts: many(userSteamAccounts),
  publicProfiles: many(publicProfiles),
}));
