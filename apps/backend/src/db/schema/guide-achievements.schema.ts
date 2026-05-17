import { relations, sql } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { achievements } from './achievements.schema';
import { guides } from './guides.schema';

export const guideAchievements = pgTable(
  'guide_achievements',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    guideId: uuid('guide_id')
      .notNull()
      .references(() => guides.id, { onDelete: 'restrict' }),
    achievementId: uuid('achievement_id')
      .notNull()
      .references(() => achievements.id, { onDelete: 'restrict' }),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('guide_achievements_guide_id_achievement_id_key').on(
      table.guideId,
      table.achievementId,
    ),
    index('guide_achievements_guide_id_idx').on(table.guideId),
    index('guide_achievements_achievement_id_idx').on(table.achievementId),
  ],
);

export const guideAchievementsRelations = relations(
  guideAchievements,
  ({ one }) => ({
    guide: one(guides, {
      fields: [guideAchievements.guideId],
      references: [guides.id],
    }),
    achievement: one(achievements, {
      fields: [guideAchievements.achievementId],
      references: [achievements.id],
    }),
  }),
);
