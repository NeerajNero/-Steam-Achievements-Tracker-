import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { appUsers } from './app-users.schema';
import { gamingSessions } from './gaming-sessions.schema';

export const gamingSessionParticipants = pgTable(
  'gaming_session_participants',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => gamingSessions.id, { onDelete: 'restrict' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'restrict' }),
    role: text('role').notNull().default('participant'),
    status: text('status').notNull().default('joined'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    leftAt: timestamp('left_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('gaming_session_participants_session_user_key').on(
      table.sessionId,
      table.userId,
    ),
    index('gaming_session_participants_session_id_idx').on(table.sessionId),
    index('gaming_session_participants_user_id_idx').on(table.userId),
    index('gaming_session_participants_session_status_idx').on(
      table.sessionId,
      table.status,
    ),
    check(
      'gaming_session_participants_role_check',
      sql`${table.role} IN ('host', 'participant')`,
    ),
    check(
      'gaming_session_participants_status_check',
      sql`${table.status} IN ('joined', 'left', 'removed', 'no_show')`,
    ),
  ],
);

export const gamingSessionParticipantsRelations = relations(
  gamingSessionParticipants,
  ({ one }) => ({
    session: one(gamingSessions, {
      fields: [gamingSessionParticipants.sessionId],
      references: [gamingSessions.id],
    }),
    user: one(appUsers, {
      fields: [gamingSessionParticipants.userId],
      references: [appUsers.id],
    }),
  }),
);
