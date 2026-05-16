import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { achievements } from './achievements.schema';
import { steamProfiles } from './steam-profiles.schema';

export const profileAchievements = pgTable(
  'profile_achievements',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => steamProfiles.id, { onDelete: 'restrict' }),
    achievementId: uuid('achievement_id')
      .notNull()
      .references(() => achievements.id, { onDelete: 'restrict' }),
    achieved: boolean('achieved').notNull().default(false),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('profile_achievements_profile_id_achievement_id_key').on(
      table.profileId,
      table.achievementId,
    ),
    index('profile_achievements_profile_id_idx').on(table.profileId),
    index('profile_achievements_achievement_id_idx').on(table.achievementId),
    index('profile_achievements_profile_achieved_idx').on(
      table.profileId,
      table.achieved,
    ),
    index('profile_achievements_profile_unlocked_at_idx').on(
      table.profileId,
      table.unlockedAt,
    ),
  ],
);

export const profileAchievementsRelations = relations(
  profileAchievements,
  ({ one }) => ({
    profile: one(steamProfiles, {
      fields: [profileAchievements.profileId],
      references: [steamProfiles.id],
    }),
    achievement: one(achievements, {
      fields: [profileAchievements.achievementId],
      references: [achievements.id],
    }),
  }),
);
