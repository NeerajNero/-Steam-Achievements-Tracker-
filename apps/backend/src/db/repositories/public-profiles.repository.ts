import { Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import {
  publicProfiles,
  steamProfiles,
  type PublicProfileSettings,
} from '../schema';

export type PublicProfile = typeof publicProfiles.$inferSelect;

export interface PublicProfileWithSteamProfile {
  publicProfile: PublicProfile;
  steamProfile: typeof steamProfiles.$inferSelect;
}

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

  async findBySlug(slug: string): Promise<PublicProfile | null> {
    const rows = await this.databaseService.db
      .select()
      .from(publicProfiles)
      .where(eq(publicProfiles.slug, slug))
      .limit(1);

    return rows[0] ?? null;
  }

  async findPublicBySlug(
    slug: string,
  ): Promise<PublicProfileWithSteamProfile | null> {
    const rows = await this.databaseService.db
      .select({
        publicProfile: publicProfiles,
        steamProfile: steamProfiles,
      })
      .from(publicProfiles)
      .innerJoin(
        steamProfiles,
        eq(publicProfiles.steamProfileId, steamProfiles.id),
      )
      .where(
        and(
          eq(publicProfiles.slug, slug),
          eq(publicProfiles.isPublic, true),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async create(input: {
    userId: string;
    steamProfileId: string;
    slug?: string | null;
    isPublic?: boolean;
    settings?: PublicProfileSettings;
  }): Promise<PublicProfile> {
    const rows = await this.databaseService.db
      .insert(publicProfiles)
      .values({
        userId: input.userId,
        steamProfileId: input.steamProfileId,
        slug: input.slug ?? null,
        isPublic: input.isPublic ?? true,
        settings: input.settings ?? {},
      })
      .returning();

    return rows[0];
  }

  async updateById(
    id: string,
    input: {
      slug?: string | null;
      isPublic?: boolean;
      settings?: PublicProfileSettings;
    },
  ): Promise<PublicProfile | null> {
    const rows = await this.databaseService.db
      .update(publicProfiles)
      .set({
        ...input,
        updatedAt: sql`now()`,
      })
      .where(eq(publicProfiles.id, id))
      .returning();

    return rows[0] ?? null;
  }

  async updateByUserAndProfileId(
    userId: string,
    steamProfileId: string,
    input: {
      slug?: string | null;
      isPublic?: boolean;
      settings?: PublicProfileSettings;
    },
  ): Promise<PublicProfile | null> {
    const rows = await this.databaseService.db
      .update(publicProfiles)
      .set({
        ...input,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(publicProfiles.userId, userId),
          eq(publicProfiles.steamProfileId, steamProfileId),
        ),
      )
      .returning();

    return rows[0] ?? null;
  }
}
