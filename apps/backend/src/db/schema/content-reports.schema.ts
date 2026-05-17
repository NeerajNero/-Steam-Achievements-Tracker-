import { relations, sql } from 'drizzle-orm';
import { check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { appUsers } from './app-users.schema';

export const contentReports = pgTable(
  'content_reports',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    reporterUserId: uuid('reporter_user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'restrict' }),
    targetType: text('target_type').notNull(),
    targetId: uuid('target_id').notNull(),
    reason: text('reason').notNull(),
    details: text('details'),
    status: text('status').notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('content_reports_reporter_user_id_idx').on(table.reporterUserId),
    index('content_reports_target_idx').on(table.targetType, table.targetId),
    index('content_reports_status_idx').on(table.status),
    index('content_reports_created_at_idx').on(table.createdAt.desc()),
    check(
      'content_reports_target_type_check',
      sql`${table.targetType} IN ('guide', 'guide_comment', 'gaming_session', 'session_comment')`,
    ),
    check(
      'content_reports_reason_check',
      sql`${table.reason} IN ('spam', 'abuse', 'off_topic', 'cheating', 'other')`,
    ),
    check(
      'content_reports_status_check',
      sql`${table.status} IN ('open', 'reviewed', 'dismissed', 'actioned')`,
    ),
    check(
      'content_reports_details_length_check',
      sql`${table.details} IS NULL OR char_length(${table.details}) <= 2000`,
    ),
  ],
);

export const contentReportsRelations = relations(contentReports, ({ one }) => ({
  reporter: one(appUsers, {
    fields: [contentReports.reporterUserId],
    references: [appUsers.id],
  }),
}));
