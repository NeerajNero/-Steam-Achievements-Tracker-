import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { publicProfiles } from '../schema';

export type PublicProfile = typeof publicProfiles.$inferSelect;

@Injectable()
export class PublicProfilesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByUserAndProfileId(
    userId: string,
    steamProfileId: string,
  ): Promise<PublicProfile | null> {
    const rows = await this.databaseService.db
      .select()
      .from(publicProfiles)
      .where(
        and(
          eq(publicProfiles.userId, userId),
          eq(publicProfiles.steamProfileId, steamProfileId),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async findPrimaryByUserId(userId: string): Promise<PublicProfile | null> {
    const rows = await this.databaseService.db
      .select()
      .from(publicProfiles)
      .where(eq(publicProfiles.userId, userId))
      .limit(1);

    return rows[0] ?? null;
  }

  async create(input: {
    userId: string;
    steamProfileId: string;
    slug?: string | null;
    isPublic?: boolean;
  }): Promise<PublicProfile> {
    const rows = await this.databaseService.db
      .insert(publicProfiles)
      .values({
        userId: input.userId,
        steamProfileId: input.steamProfileId,
        slug: input.slug ?? null,
        isPublic: input.isPublic ?? true,
      })
      .returning();

    return rows[0];
  }
}

