import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { badges, profileBadges } from '../schema';
import type { Badge } from './badges.repository';

export type ProfileBadge = InferSelectModel<typeof profileBadges>;
export type NewProfileBadge = InferInsertModel<typeof profileBadges>;

export interface ProfileBadgeWithBadge {
  profileBadge: ProfileBadge;
  badge: Badge;
}

export interface AwardProfileBadgeInput {
  steamProfileId: string;
  badgeId: string;
  sourceMilestoneId?: string | null;
  earnedAt?: Date;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ProfileBadgesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async awardIfNotExists(
    input: AwardProfileBadgeInput,
  ): Promise<ProfileBadge | null> {
    const rows = await this.databaseService.db
      .insert(profileBadges)
      .values({
        steamProfileId: input.steamProfileId,
        badgeId: input.badgeId,
        sourceMilestoneId: input.sourceMilestoneId ?? null,
        earnedAt: input.earnedAt,
        metadata: input.metadata ?? {},
      })
      .onConflictDoNothing({
        target: [profileBadges.steamProfileId, profileBadges.badgeId],
      })
      .returning();

    return rows[0] ?? null;
  }

  async findBySteamProfileId(
    steamProfileId: string,
  ): Promise<ProfileBadgeWithBadge[]> {
    return this.databaseService.db
      .select({
        profileBadge: profileBadges,
        badge: badges,
      })
      .from(profileBadges)
      .innerJoin(badges, eq(badges.id, profileBadges.badgeId))
      .where(eq(profileBadges.steamProfileId, steamProfileId))
      .orderBy(desc(profileBadges.earnedAt), asc(badges.sortOrder), asc(badges.name));
  }

  async findOneByProfileAndBadge(
    steamProfileId: string,
    badgeId: string,
  ): Promise<ProfileBadgeWithBadge | null> {
    const rows = await this.databaseService.db
      .select({
        profileBadge: profileBadges,
        badge: badges,
      })
      .from(profileBadges)
      .innerJoin(badges, eq(badges.id, profileBadges.badgeId))
      .where(
        and(
          eq(profileBadges.steamProfileId, steamProfileId),
          eq(profileBadges.badgeId, badgeId),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }
}
