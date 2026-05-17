import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { appUsers } from './app-users.schema';
import { steamProfiles } from './steam-profiles.schema';

export const profileShowcaseItems = pgTable(
  'profile_showcase_items',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    steamProfileId: uuid('steam_profile_id')
      .notNull()
      .references(() => steamProfiles.id, { onDelete: 'restrict' }),
    ownerUserId: uuid('owner_user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'restrict' }),
    itemType: text('item_type').notNull(),
    itemId: uuid('item_id').notNull(),
    position: integer('position').notNull().default(0),
    visibility: text('visibility').notNull().default('public'),
    titleOverride: text('title_override'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('profile_showcase_items_unique_profile_item').on(
      table.steamProfileId,
      table.itemType,
      table.itemId,
    ),
    unique('profile_showcase_items_unique_profile_position').on(
      table.steamProfileId,
      table.position,
    ),
    index('profile_showcase_items_profile_position_idx').on(
      table.steamProfileId,
      table.position,
    ),
    index('profile_showcase_items_owner_user_id_idx').on(table.ownerUserId),
    index('profile_showcase_items_item_idx').on(table.itemType, table.itemId),
    index('profile_showcase_items_visibility_idx').on(table.visibility),
    check(
      'profile_showcase_items_item_type_check',
      sql`${table.itemType} IN ('badge', 'milestone', 'achievement', 'guide', 'gaming_session')`,
    ),
    check(
      'profile_showcase_items_visibility_check',
      sql`${table.visibility} IN ('public', 'private')`,
    ),
    check('profile_showcase_items_position_check', sql`${table.position} >= 0`),
  ],
);

export const profileShowcaseItemsRelations = relations(
  profileShowcaseItems,
  ({ one }) => ({
    steamProfile: one(steamProfiles, {
      fields: [profileShowcaseItems.steamProfileId],
      references: [steamProfiles.id],
    }),
    ownerUser: one(appUsers, {
      fields: [profileShowcaseItems.ownerUserId],
      references: [appUsers.id],
    }),
  }),
);
