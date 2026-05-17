import { relations, sql } from 'drizzle-orm';
import { check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { appUsers } from './app-users.schema';
import { gamingSessions } from './gaming-sessions.schema';

export const sessionComments = pgTable(
  'session_comments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => gamingSessions.id, { onDelete: 'restrict' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'restrict' }),
    body: text('body').notNull(),
    status: text('status').notNull().default('visible'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('session_comments_session_id_idx').on(table.sessionId),
    index('session_comments_user_id_idx').on(table.userId),
    index('session_comments_session_created_at_idx').on(
      table.sessionId,
      table.createdAt,
    ),
    check(
      'session_comments_status_check',
      sql`${table.status} IN ('visible', 'hidden', 'deleted')`,
    ),
    check(
      'session_comments_body_length_check',
      sql`char_length(${table.body}) >= 1 AND char_length(${table.body}) <= 2000`,
    ),
  ],
);

export const sessionCommentsRelations = relations(sessionComments, ({ one }) => ({
  session: one(gamingSessions, {
    fields: [sessionComments.sessionId],
    references: [gamingSessions.id],
  }),
  user: one(appUsers, {
    fields: [sessionComments.userId],
    references: [appUsers.id],
  }),
}));
