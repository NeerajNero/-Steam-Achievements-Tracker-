import { Injectable } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel, SQL } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import {
  achievements,
  badges,
  gamingSessions,
  guides,
  profileAchievements,
  profileBadges,
  profileMilestones,
  profileShowcaseItems,
} from '../schema';
import type { Badge } from './badges.repository';
import type { Achievement } from './achievements.repository';
import type { Guide } from './guides.repository';
import type { GamingSession } from './gaming-sessions.repository';
import type { ProfileBadge } from './profile-badges.repository';
import type { ProfileMilestone } from './profile-milestones.repository';

export type ProfileShowcaseItem = InferSelectModel<typeof profileShowcaseItems>;
export type NewProfileShowcaseItem = InferInsertModel<typeof profileShowcaseItems>;

export type ProfileShowcaseItemType =
  | 'badge'
  | 'milestone'
  | 'achievement'
  | 'guide'
  | 'gaming_session';

export type ProfileShowcaseVisibility = 'public' | 'private';

export interface ReplaceProfileShowcaseItemInput {
  itemType: ProfileShowcaseItemType;
  itemId: string;
  position: number;
  visibility: ProfileShowcaseVisibility;
  titleOverride?: string | null;
}

export interface ProfileShowcaseItemWithDetails {
  item: ProfileShowcaseItem;
  badge: Badge | null;
  profileBadge: ProfileBadge | null;
  milestone: ProfileMilestone | null;
  achievement: Achievement | null;
  guide: Guide | null;
  gamingSession: GamingSession | null;
}

@Injectable()
export class ProfileShowcaseItemsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findBySteamProfileId(
    steamProfileId: string,
    options: { publicOnly?: boolean } = {},
  ): Promise<ProfileShowcaseItemWithDetails[]> {
    const conditions: SQL[] = [
      eq(profileShowcaseItems.steamProfileId, steamProfileId),
    ];

    if (options.publicOnly === true) {
      conditions.push(eq(profileShowcaseItems.visibility, 'public'));
    }

    return this.databaseService.db
      .select({
        item: profileShowcaseItems,
        badge: badges,
        profileBadge: profileBadges,
        milestone: profileMilestones,
        achievement: achievements,
        guide: guides,
        gamingSession: gamingSessions,
      })
      .from(profileShowcaseItems)
      .leftJoin(
        profileBadges,
        and(
          eq(profileShowcaseItems.itemType, 'badge'),
          eq(profileBadges.id, profileShowcaseItems.itemId),
          eq(profileBadges.steamProfileId, profileShowcaseItems.steamProfileId),
        ),
      )
      .leftJoin(badges, eq(badges.id, profileBadges.badgeId))
      .leftJoin(
        profileMilestones,
        and(
          eq(profileShowcaseItems.itemType, 'milestone'),
          eq(profileMilestones.id, profileShowcaseItems.itemId),
          eq(profileMilestones.steamProfileId, profileShowcaseItems.steamProfileId),
        ),
      )
      .leftJoin(
        profileAchievements,
        and(
          eq(profileShowcaseItems.itemType, 'achievement'),
          eq(profileAchievements.id, profileShowcaseItems.itemId),
          eq(profileAchievements.profileId, profileShowcaseItems.steamProfileId),
        ),
      )
      .leftJoin(achievements, eq(achievements.id, profileAchievements.achievementId))
      .leftJoin(
        guides,
        and(
          eq(profileShowcaseItems.itemType, 'guide'),
          eq(guides.id, profileShowcaseItems.itemId),
        ),
      )
      .leftJoin(
        gamingSessions,
        and(
          eq(profileShowcaseItems.itemType, 'gaming_session'),
          eq(gamingSessions.id, profileShowcaseItems.itemId),
        ),
      )
      .where(and(...conditions))
      .orderBy(asc(profileShowcaseItems.position), asc(profileShowcaseItems.id));
  }

  async replaceForProfile(input: {
    steamProfileId: string;
    ownerUserId: string;
    items: ReplaceProfileShowcaseItemInput[];
  }): Promise<ProfileShowcaseItem[]> {
    return this.databaseService.db.transaction(async (tx) => {
      await tx
        .delete(profileShowcaseItems)
        .where(eq(profileShowcaseItems.steamProfileId, input.steamProfileId));

      if (input.items.length === 0) {
        return [];
      }

      return tx
        .insert(profileShowcaseItems)
        .values(
          input.items.map((item) => ({
            steamProfileId: input.steamProfileId,
            ownerUserId: input.ownerUserId,
            itemType: item.itemType,
            itemId: item.itemId,
            position: item.position,
            visibility: item.visibility,
            titleOverride: item.titleOverride ?? null,
          })),
        )
        .returning();
    });
  }

  async findInvalidEarnedBadgeIds(
    steamProfileId: string,
    profileBadgeIds: string[],
  ): Promise<string[]> {
    if (profileBadgeIds.length === 0) {
      return [];
    }

    const rows = await this.databaseService.db
      .select({ id: profileBadges.id })
      .from(profileBadges)
      .where(
        and(
          eq(profileBadges.steamProfileId, steamProfileId),
          inArray(profileBadges.id, profileBadgeIds),
        ),
      );
    const found = new Set(rows.map((row) => row.id));
    return profileBadgeIds.filter((id) => !found.has(id));
  }

  async findInvalidMilestoneIds(
    steamProfileId: string,
    milestoneIds: string[],
  ): Promise<string[]> {
    if (milestoneIds.length === 0) {
      return [];
    }

    const rows = await this.databaseService.db
      .select({ id: profileMilestones.id })
      .from(profileMilestones)
      .where(
        and(
          eq(profileMilestones.steamProfileId, steamProfileId),
          inArray(profileMilestones.id, milestoneIds),
        ),
      );
    const found = new Set(rows.map((row) => row.id));
    return milestoneIds.filter((id) => !found.has(id));
  }

  async findInvalidAchievementIds(
    steamProfileId: string,
    profileAchievementIds: string[],
  ): Promise<string[]> {
    if (profileAchievementIds.length === 0) {
      return [];
    }

    const rows = await this.databaseService.db
      .select({ id: profileAchievements.id })
      .from(profileAchievements)
      .where(
        and(
          eq(profileAchievements.profileId, steamProfileId),
          inArray(profileAchievements.id, profileAchievementIds),
        ),
      );
    const found = new Set(rows.map((row) => row.id));
    return profileAchievementIds.filter((id) => !found.has(id));
  }

  async findInvalidGuideIds(
    ownerUserId: string,
    guidesToShowcase: Array<{ id: string; visibility: ProfileShowcaseVisibility }>,
  ): Promise<string[]> {
    if (guidesToShowcase.length === 0) {
      return [];
    }

    const rows = await this.databaseService.db
      .select({ id: guides.id, authorUserId: guides.authorUserId, status: guides.status, visibility: guides.visibility })
      .from(guides)
      .where(inArray(guides.id, guidesToShowcase.map((item) => item.id)));
    const byId = new Map(rows.map((row) => [row.id, row]));

    return guidesToShowcase
      .filter((item) => {
        const guide = byId.get(item.id);

        if (guide === undefined) {
          return true;
        }

        if (guide.authorUserId === ownerUserId) {
          return false;
        }

        return !(
          item.visibility === 'public' &&
          guide.status === 'published' &&
          guide.visibility === 'public'
        );
      })
      .map((item) => item.id);
  }

  async findInvalidGamingSessionIds(
    ownerUserId: string,
    sessionsToShowcase: Array<{ id: string; visibility: ProfileShowcaseVisibility }>,
  ): Promise<string[]> {
    if (sessionsToShowcase.length === 0) {
      return [];
    }

    const rows = await this.databaseService.db
      .select({
        id: gamingSessions.id,
        hostUserId: gamingSessions.hostUserId,
        visibility: gamingSessions.visibility,
      })
      .from(gamingSessions)
      .where(inArray(gamingSessions.id, sessionsToShowcase.map((item) => item.id)));
    const byId = new Map(rows.map((row) => [row.id, row]));

    return sessionsToShowcase
      .filter((item) => {
        const session = byId.get(item.id);

        if (session === undefined) {
          return true;
        }

        if (session.hostUserId === ownerUserId) {
          return false;
        }

        return !(item.visibility === 'public' && session.visibility === 'public');
      })
      .map((item) => item.id);
  }
}
