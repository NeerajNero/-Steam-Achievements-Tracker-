import { relations, sql } from 'drizzle-orm';
import { index, inet, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { appUsers } from './app-users.schema';

export const authSessions = pgTable(
  'auth_sessions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'restrict' }),
    sessionTokenHash: text('session_token_hash').notNull(),
    userAgent: text('user_agent'),
    ipAddress: inet('ip_address'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('auth_sessions_session_token_hash_key').on(table.sessionTokenHash),
    index('auth_sessions_user_id_idx').on(table.userId),
    index('auth_sessions_expires_at_idx').on(table.expiresAt),
    index('auth_sessions_revoked_at_idx').on(table.revokedAt),
  ],
);

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(appUsers, {
    fields: [authSessions.userId],
    references: [appUsers.id],
  }),
}));
