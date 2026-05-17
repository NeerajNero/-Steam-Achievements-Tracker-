import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel, SQL } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { profileMilestones } from '../schema';

export type ProfileMilestone = InferSelectModel<typeof profileMilestones>;
export type NewProfileMilestone = InferInsertModel<typeof profileMilestones>;

export type ProfileMilestoneType =
  | 'first_sync'
  | 'first_completed_game'
  | 'completed_games_count'
  | 'unlocked_achievements_count'
  | 'completion_percentage'
  | 'rare_achievement';

export interface CreateProfileMilestoneInput {
  steamProfileId: string;
  milestoneType: ProfileMilestoneType;
  thresholdValue?: number | null;
  title: string;
  description?: string | null;
  achievedAt?: Date;
  sourceSnapshotId?: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ProfileMilestonesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createIfNotExists(
    input: CreateProfileMilestoneInput,
  ): Promise<ProfileMilestone | null> {
    const existing = await this.findExisting(
      input.steamProfileId,
      input.milestoneType,
      input.thresholdValue ?? null,
    );

    if (existing !== null) {
      return null;
    }

    const rows = await this.databaseService.db
      .insert(profileMilestones)
      .values({
        steamProfileId: input.steamProfileId,
        milestoneType: input.milestoneType,
        thresholdValue: input.thresholdValue ?? null,
        title: input.title,
        description: input.description ?? null,
        achievedAt: input.achievedAt,
        sourceSnapshotId: input.sourceSnapshotId ?? null,
        metadata: input.metadata ?? {},
      })
      .onConflictDoNothing()
      .returning();

    return rows[0] ?? null;
  }

  async findBySteamProfileId(
    steamProfileId: string,
    input: { limit: number; offset: number },
  ): Promise<ProfileMilestone[]> {
    return this.databaseService.db
      .select()
      .from(profileMilestones)
      .where(eq(profileMilestones.steamProfileId, steamProfileId))
      .orderBy(desc(profileMilestones.achievedAt), desc(profileMilestones.id))
      .limit(input.limit)
      .offset(input.offset);
  }

  async countBySteamProfileId(steamProfileId: string): Promise<number> {
    const rows = await this.databaseService.db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(profileMilestones)
      .where(eq(profileMilestones.steamProfileId, steamProfileId));

    return rows[0]?.total ?? 0;
  }

  private async findExisting(
    steamProfileId: string,
    milestoneType: ProfileMilestoneType,
    thresholdValue: number | null,
  ): Promise<ProfileMilestone | null> {
    const conditions: SQL[] = [
      eq(profileMilestones.steamProfileId, steamProfileId),
      eq(profileMilestones.milestoneType, milestoneType),
      thresholdValue === null
        ? isNull(profileMilestones.thresholdValue)
        : eq(profileMilestones.thresholdValue, thresholdValue),
    ];

    const rows = await this.databaseService.db
      .select()
      .from(profileMilestones)
      .where(and(...conditions))
      .limit(1);

    return rows[0] ?? null;
  }
}
