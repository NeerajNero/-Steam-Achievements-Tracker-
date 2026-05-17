import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { appUsers } from './app-users.schema';
import { games } from './games.schema';
import { guideAchievements } from './guide-achievements.schema';
import { guideSections } from './guide-sections.schema';

export const guides = pgTable(
  'guides',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    steamAppId: integer('steam_app_id')
      .notNull()
      .references(() => games.steamAppId, { onDelete: 'restrict' }),
    authorUserId: uuid('author_user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    summary: text('summary'),
    status: text('status').notNull().default('draft'),
    visibility: text('visibility').notNull().default('public'),
    estimatedDifficulty: integer('estimated_difficulty'),
    estimatedHours: integer('estimated_hours'),
    isSpoilerHeavy: boolean('is_spoiler_heavy').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('guides_steam_app_id_slug_key').on(table.steamAppId, table.slug),
    index('guides_steam_app_id_idx').on(table.steamAppId),
    index('guides_author_user_id_idx').on(table.authorUserId),
    index('guides_status_idx').on(table.status),
    index('guides_visibility_idx').on(table.visibility),
    index('guides_published_at_idx').on(table.publishedAt.desc()),
    index('guides_steam_app_id_status_visibility_idx').on(
      table.steamAppId,
      table.status,
      table.visibility,
    ),
    check(
      'guides_status_check',
      sql`${table.status} IN ('draft', 'published', 'archived')`,
    ),
    check(
      'guides_visibility_check',
      sql`${table.visibility} IN ('public', 'unlisted', 'private')`,
    ),
    check(
      'guides_estimated_difficulty_check',
      sql`${table.estimatedDifficulty} IS NULL OR (${table.estimatedDifficulty} >= 1 AND ${table.estimatedDifficulty} <= 10)`,
    ),
    check(
      'guides_estimated_hours_check',
      sql`${table.estimatedHours} IS NULL OR ${table.estimatedHours} >= 0`,
    ),
    check('guides_slug_check', sql`${table.slug} ~ '^[a-z0-9-]{3,80}$'`),
  ],
);

export const guidesRelations = relations(guides, ({ one, many }) => ({
  author: one(appUsers, {
    fields: [guides.authorUserId],
    references: [appUsers.id],
  }),
  game: one(games, {
    fields: [guides.steamAppId],
    references: [games.steamAppId],
  }),
  sections: many(guideSections),
  achievements: many(guideAchievements),
}));
