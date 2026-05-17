import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { profileSnapshots } from './profile-snapshots.schema';
import { steamProfiles } from './steam-profiles.schema';

export type ProfileMilestoneMetadata = Record<string, unknown>;

export const profileMilestones = pgTable(
  'profile_milestones',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    steamProfileId: uuid('steam_profile_id')
      .notNull()
      .references(() => steamProfiles.id, { onDelete: 'restrict' }),
    milestoneType: text('milestone_type').notNull(),
    thresholdValue: integer('threshold_value'),
    title: text('title').notNull(),
    description: text('description'),
    achievedAt: timestamp('achieved_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    sourceSnapshotId: uuid('source_snapshot_id').references(
      () => profileSnapshots.id,
      { onDelete: 'restrict' },
    ),
    metadata: jsonb('metadata')
      .$type<ProfileMilestoneMetadata>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('profile_milestones_profile_type_threshold_key').on(
      table.steamProfileId,
      table.milestoneType,
      sql`coalesce(${table.thresholdValue}, -1)`,
    ),
    index('profile_milestones_profile_achieved_at_desc_idx').on(
      table.steamProfileId,
      table.achievedAt.desc(),
    ),
    index('profile_milestones_milestone_type_idx').on(table.milestoneType),
    index('profile_milestones_achieved_at_desc_idx').on(table.achievedAt.desc()),
    check(
      'profile_milestones_milestone_type_check',
      sql`${table.milestoneType} IN ('first_sync', 'first_completed_game', 'completed_games_count', 'unlocked_achievements_count', 'completion_percentage', 'rare_achievement')`,
    ),
    check(
      'profile_milestones_threshold_non_negative_check',
      sql`${table.thresholdValue} IS NULL OR ${table.thresholdValue} >= 0`,
    ),
    check(
      'profile_milestones_metadata_object_check',
      sql`jsonb_typeof(${table.metadata}) = 'object'`,
    ),
  ],
);

export const profileMilestonesRelations = relations(
  profileMilestones,
  ({ one }) => ({
    steamProfile: one(steamProfiles, {
      fields: [profileMilestones.steamProfileId],
      references: [steamProfiles.id],
    }),
    sourceSnapshot: one(profileSnapshots, {
      fields: [profileMilestones.sourceSnapshotId],
      references: [profileSnapshots.id],
    }),
  }),
);
