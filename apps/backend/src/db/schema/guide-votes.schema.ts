import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { appUsers } from './app-users.schema';
import { guides } from './guides.schema';

export const guideVotes = pgTable(
  'guide_votes',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    guideId: uuid('guide_id')
      .notNull()
      .references(() => guides.id, { onDelete: 'restrict' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'restrict' }),
    value: integer('value').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('guide_votes_guide_user_key').on(table.guideId, table.userId),
    index('guide_votes_guide_id_idx').on(table.guideId),
    index('guide_votes_user_id_idx').on(table.userId),
    index('guide_votes_guide_value_idx').on(table.guideId, table.value),
    check('guide_votes_value_check', sql`${table.value} IN (-1, 1)`),
  ],
);

export const guideVotesRelations = relations(guideVotes, ({ one }) => ({
  guide: one(guides, {
    fields: [guideVotes.guideId],
    references: [guides.id],
  }),
  user: one(appUsers, {
    fields: [guideVotes.userId],
    references: [appUsers.id],
  }),
}));
