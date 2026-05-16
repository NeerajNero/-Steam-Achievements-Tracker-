import { relations, sql } from 'drizzle-orm';
import { check, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { steamProfiles } from './steam-profiles.schema';

export type SyncRunMetadata = Record<string, unknown>;

export const syncRuns = pgTable(
  'sync_runs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    profileId: uuid('profile_id').references(() => steamProfiles.id, {
      onDelete: 'set null',
    }),
    syncType: text('sync_type').notNull(),
    status: text('status').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    errorMessage: text('error_message'),
    metadata: jsonb('metadata')
      .$type<SyncRunMetadata>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('sync_runs_profile_started_at_idx').on(table.profileId, table.startedAt.desc()),
    index('sync_runs_status_idx').on(table.status),
    check(
      'sync_runs_sync_type_check',
      sql`${table.syncType} IN ('profile', 'games', 'achievements', 'full')`,
    ),
    check(
      'sync_runs_status_check',
      sql`${table.status} IN ('queued', 'running', 'success', 'partial_success', 'failed')`,
    ),
    check(
      'sync_runs_finished_at_check',
      sql`${table.finishedAt} IS NULL OR ${table.finishedAt} >= ${table.startedAt}`,
    ),
  ],
);

export const syncRunsRelations = relations(syncRuns, ({ one }) => ({
  profile: one(steamProfiles, {
    fields: [syncRuns.profileId],
    references: [steamProfiles.id],
  }),
}));
