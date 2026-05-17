import { relations, sql } from 'drizzle-orm';
import { check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { appUsers } from './app-users.schema';
import { guides } from './guides.schema';

export const guideComments = pgTable(
  'guide_comments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    guideId: uuid('guide_id')
      .notNull()
      .references(() => guides.id, { onDelete: 'restrict' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'restrict' }),
    body: text('body').notNull(),
    status: text('status').notNull().default('visible'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('guide_comments_guide_id_idx').on(table.guideId),
    index('guide_comments_user_id_idx').on(table.userId),
    index('guide_comments_guide_created_at_idx').on(
      table.guideId,
      table.createdAt,
    ),
    check(
      'guide_comments_status_check',
      sql`${table.status} IN ('visible', 'hidden', 'deleted')`,
    ),
    check(
      'guide_comments_body_length_check',
      sql`char_length(${table.body}) >= 1 AND char_length(${table.body}) <= 2000`,
    ),
  ],
);

export const guideCommentsRelations = relations(guideComments, ({ one }) => ({
  guide: one(guides, {
    fields: [guideComments.guideId],
    references: [guides.id],
  }),
  user: one(appUsers, {
    fields: [guideComments.userId],
    references: [appUsers.id],
  }),
}));
