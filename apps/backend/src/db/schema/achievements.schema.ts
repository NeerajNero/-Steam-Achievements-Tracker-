import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { profileAchievements } from './profile-achievements.schema';

export const achievements = pgTable(
  'achievements',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    steamAppId: integer('steam_app_id').notNull(),
    apiName: text('api_name').notNull(),
    displayName: text('display_name'),
    description: text('description'),
    iconUrl: text('icon_url'),
    iconGrayUrl: text('icon_gray_url'),
    globalPercentage: numeric('global_percentage', {
      precision: 6,
      scale: 3,
      mode: 'number',
    }),
    hidden: boolean('hidden').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('achievements_steam_app_id_api_name_key').on(
      table.steamAppId,
      table.apiName,
    ),
    index('achievements_steam_app_id_idx').on(table.steamAppId),
    index('achievements_steam_app_global_percentage_idx').on(
      table.steamAppId,
      table.globalPercentage,
    ),
    check(
      'achievements_global_percentage_check',
      sql`${table.globalPercentage} IS NULL OR (${table.globalPercentage} >= 0 AND ${table.globalPercentage} <= 100)`,
    ),
  ],
);

export const achievementsRelations = relations(achievements, ({ many }) => ({
  profileAchievements: many(profileAchievements),
}));
