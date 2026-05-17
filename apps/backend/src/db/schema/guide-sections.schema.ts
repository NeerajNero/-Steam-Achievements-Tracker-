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

import { guides } from './guides.schema';

export const guideSections = pgTable(
  'guide_sections',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    guideId: uuid('guide_id')
      .notNull()
      .references(() => guides.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('guide_sections_guide_id_idx').on(table.guideId),
    index('guide_sections_guide_id_position_idx').on(
      table.guideId,
      table.position,
    ),
    check('guide_sections_position_check', sql`${table.position} >= 0`),
  ],
);

export const guideSectionsRelations = relations(guideSections, ({ one }) => ({
  guide: one(guides, {
    fields: [guideSections.guideId],
    references: [guides.id],
  }),
}));
