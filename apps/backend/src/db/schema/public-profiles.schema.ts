import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { appUsers } from './app-users.schema';
import { steamProfiles } from './steam-profiles.schema';

export type PublicProfileSettings = Record<string, unknown>;

export const publicProfiles = pgTable(
  'public_profiles',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'restrict' }),
    steamProfileId: uuid('steam_profile_id')
      .notNull()
      .references(() => steamProfiles.id, { onDelete: 'restrict' }),
    slug: text('slug'),
    isPublic: boolean('is_public').notNull().default(true),
    settings: jsonb('settings')
      .$type<PublicProfileSettings>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('public_profiles_user_profile_key').on(
      table.userId,
      table.steamProfileId,
    ),
    uniqueIndex('public_profiles_steam_profile_id_key').on(table.steamProfileId),
    uniqueIndex('public_profiles_slug_key').on(table.slug),
    index('public_profiles_user_id_idx').on(table.userId),
    index('public_profiles_steam_profile_id_idx').on(table.steamProfileId),
    check(
      'public_profiles_slug_format_check',
      sql`${table.slug} IS NULL OR ${table.slug} ~ '^[a-z0-9-]{3,64}$'`,
    ),
  ],
);

export const publicProfilesRelations = relations(publicProfiles, ({ one }) => ({
  user: one(appUsers, {
    fields: [publicProfiles.userId],
    references: [appUsers.id],
  }),
  steamProfile: one(steamProfiles, {
    fields: [publicProfiles.steamProfileId],
    references: [steamProfiles.id],
  }),
}));
