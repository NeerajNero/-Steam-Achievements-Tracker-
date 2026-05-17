import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const badges = pgTable(
  'badges',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    badgeType: text('badge_type').notNull(),
    tier: text('tier'),
    iconKey: text('icon_key'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('badges_badge_type_idx').on(table.badgeType),
    index('badges_is_active_idx').on(table.isActive),
    index('badges_sort_order_idx').on(table.sortOrder),
    check(
      'badges_badge_type_check',
      sql`${table.badgeType} IN ('milestone', 'completion', 'rarity', 'community', 'special')`,
    ),
    check(
      'badges_tier_check',
      sql`${table.tier} IS NULL OR ${table.tier} IN ('bronze', 'silver', 'gold', 'platinum')`,
    ),
  ],
);

export const badgesRelations = relations(badges, () => ({}));
