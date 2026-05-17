import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  jsonb,
  pgTable,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { badges } from './badges.schema';
import { profileMilestones } from './profile-milestones.schema';
import { steamProfiles } from './steam-profiles.schema';

export type ProfileBadgeMetadata = Record<string, unknown>;

export const profileBadges = pgTable(
  'profile_badges',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    steamProfileId: uuid('steam_profile_id')
      .notNull()
      .references(() => steamProfiles.id, { onDelete: 'restrict' }),
    badgeId: uuid('badge_id')
      .notNull()
      .references(() => badges.id, { onDelete: 'restrict' }),
    sourceMilestoneId: uuid('source_milestone_id').references(
      () => profileMilestones.id,
      { onDelete: 'restrict' },
    ),
    earnedAt: timestamp('earned_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    metadata: jsonb('metadata')
      .$type<ProfileBadgeMetadata>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('profile_badges_unique_profile_badge').on(
      table.steamProfileId,
      table.badgeId,
    ),
    index('profile_badges_steam_profile_id_idx').on(table.steamProfileId),
    index('profile_badges_badge_id_idx').on(table.badgeId),
    index('profile_badges_earned_at_desc_idx').on(table.earnedAt.desc()),
    check(
      'profile_badges_metadata_object_check',
      sql`jsonb_typeof(${table.metadata}) = 'object'`,
    ),
  ],
);

export const profileBadgesRelations = relations(profileBadges, ({ one }) => ({
  steamProfile: one(steamProfiles, {
    fields: [profileBadges.steamProfileId],
    references: [steamProfiles.id],
  }),
  badge: one(badges, {
    fields: [profileBadges.badgeId],
    references: [badges.id],
  }),
  sourceMilestone: one(profileMilestones, {
    fields: [profileBadges.sourceMilestoneId],
    references: [profileMilestones.id],
  }),
}));
