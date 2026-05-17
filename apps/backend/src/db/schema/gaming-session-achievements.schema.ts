import { relations, sql } from 'drizzle-orm';
import { index, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { achievements } from './achievements.schema';
import { gamingSessions } from './gaming-sessions.schema';

export const gamingSessionAchievements = pgTable(
  'gaming_session_achievements',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => gamingSessions.id, { onDelete: 'restrict' }),
    achievementId: uuid('achievement_id')
      .notNull()
      .references(() => achievements.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('gaming_session_achievements_session_achievement_key').on(
      table.sessionId,
      table.achievementId,
    ),
    index('gaming_session_achievements_session_id_idx').on(table.sessionId),
    index('gaming_session_achievements_achievement_id_idx').on(table.achievementId),
  ],
);

export const gamingSessionAchievementsRelations = relations(
  gamingSessionAchievements,
  ({ one }) => ({
    session: one(gamingSessions, {
      fields: [gamingSessionAchievements.sessionId],
      references: [gamingSessions.id],
    }),
    achievement: one(achievements, {
      fields: [gamingSessionAchievements.achievementId],
      references: [achievements.id],
    }),
  }),
);
