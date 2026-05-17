import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { appUsers } from './app-users.schema';
import { games } from './games.schema';
import { gamingSessionAchievements } from './gaming-session-achievements.schema';
import { gamingSessionParticipants } from './gaming-session-participants.schema';

export const gamingSessions = pgTable(
  'gaming_sessions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    steamAppId: integer('steam_app_id')
      .notNull()
      .references(() => games.steamAppId, { onDelete: 'restrict' }),
    hostUserId: uuid('host_user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').notNull().default('open'),
    visibility: text('visibility').notNull().default('public'),
    scheduledStartAt: timestamp('scheduled_start_at', { withTimezone: true }).notNull(),
    scheduledEndAt: timestamp('scheduled_end_at', { withTimezone: true }),
    timezone: text('timezone'),
    maxParticipants: integer('max_participants').notNull().default(4),
    externalVoiceUrl: text('external_voice_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('gaming_sessions_steam_app_id_idx').on(table.steamAppId),
    index('gaming_sessions_host_user_id_idx').on(table.hostUserId),
    index('gaming_sessions_status_idx').on(table.status),
    index('gaming_sessions_visibility_idx').on(table.visibility),
    index('gaming_sessions_scheduled_start_at_idx').on(table.scheduledStartAt),
    index('gaming_sessions_game_status_visibility_start_idx').on(
      table.steamAppId,
      table.status,
      table.visibility,
      table.scheduledStartAt,
    ),
    check(
      'gaming_sessions_status_check',
      sql`${table.status} IN ('open', 'full', 'completed', 'cancelled')`,
    ),
    check(
      'gaming_sessions_visibility_check',
      sql`${table.visibility} IN ('public', 'unlisted', 'private')`,
    ),
    check(
      'gaming_sessions_max_participants_check',
      sql`${table.maxParticipants} >= 2 AND ${table.maxParticipants} <= 100`,
    ),
    check(
      'gaming_sessions_schedule_check',
      sql`${table.scheduledEndAt} IS NULL OR ${table.scheduledEndAt} > ${table.scheduledStartAt}`,
    ),
    check(
      'gaming_sessions_external_voice_url_check',
      sql`${table.externalVoiceUrl} IS NULL OR ${table.externalVoiceUrl} ~* '^https?://[^[:space:]]+$'`,
    ),
  ],
);

export const gamingSessionsRelations = relations(gamingSessions, ({ one, many }) => ({
  game: one(games, {
    fields: [gamingSessions.steamAppId],
    references: [games.steamAppId],
  }),
  host: one(appUsers, {
    fields: [gamingSessions.hostUserId],
    references: [appUsers.id],
  }),
  participants: many(gamingSessionParticipants),
  achievements: many(gamingSessionAchievements),
}));
