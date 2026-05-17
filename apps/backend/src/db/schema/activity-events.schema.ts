import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { appUsers } from './app-users.schema';
import { steamProfiles } from './steam-profiles.schema';

export type ActivityEventMetadata = Record<string, unknown>;

export const activityEvents = pgTable(
  'activity_events',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    actorUserId: uuid('actor_user_id').references(() => appUsers.id, {
      onDelete: 'restrict',
    }),
    steamProfileId: uuid('steam_profile_id').references(() => steamProfiles.id, {
      onDelete: 'restrict',
    }),
    eventType: text('event_type').notNull(),
    visibility: text('visibility').notNull().default('public'),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id'),
    steamAppId: integer('steam_app_id'),
    metadata: jsonb('metadata')
      .$type<ActivityEventMetadata>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    occurredAt: timestamp('occurred_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('activity_events_occurred_at_desc_idx').on(table.occurredAt.desc()),
    index('activity_events_event_type_idx').on(table.eventType),
    index('activity_events_visibility_idx').on(table.visibility),
    index('activity_events_actor_occurred_at_desc_idx').on(
      table.actorUserId,
      table.occurredAt.desc(),
    ),
    index('activity_events_profile_occurred_at_desc_idx').on(
      table.steamProfileId,
      table.occurredAt.desc(),
    ),
    index('activity_events_steam_app_occurred_at_desc_idx').on(
      table.steamAppId,
      table.occurredAt.desc(),
    ),
    index('activity_events_entity_idx').on(table.entityType, table.entityId),
    check(
      'activity_events_event_type_check',
      sql`${table.eventType} IN ('profile_synced', 'game_completed', 'rare_achievement_synced', 'guide_published', 'guide_commented', 'guide_voted', 'session_created', 'session_joined', 'session_commented', 'milestone_reached')`,
    ),
    check(
      'activity_events_visibility_check',
      sql`${table.visibility} IN ('public', 'private')`,
    ),
    check(
      'activity_events_entity_type_check',
      sql`${table.entityType} IN ('steam_profile', 'game', 'achievement', 'guide', 'guide_comment', 'gaming_session', 'session_comment', 'milestone')`,
    ),
    check(
      'activity_events_metadata_object_check',
      sql`jsonb_typeof(${table.metadata}) = 'object'`,
    ),
  ],
);

export const activityEventsRelations = relations(activityEvents, ({ one }) => ({
  actorUser: one(appUsers, {
    fields: [activityEvents.actorUserId],
    references: [appUsers.id],
  }),
  steamProfile: one(steamProfiles, {
    fields: [activityEvents.steamProfileId],
    references: [steamProfiles.id],
  }),
}));
