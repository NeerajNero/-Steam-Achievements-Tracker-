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

import { profileGames } from './profile-games.schema';

export const games = pgTable(
  'games',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    steamAppId: integer('steam_app_id').notNull(),
    name: text('name').notNull(),
    iconUrl: text('icon_url'),
    logoUrl: text('logo_url'),
    hasAchievements: boolean('has_achievements').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('games_steam_app_id_key').on(table.steamAppId)],
);

export const gamesRelations = relations(games, ({ many }) => ({
  profileGames: many(profileGames),
}));
