import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { steamProfiles } from '../schema';

export type SteamProfile = InferSelectModel<typeof steamProfiles>;
export type NewSteamProfile = InferInsertModel<typeof steamProfiles>;

export type UpsertSteamProfileInput = Pick<NewSteamProfile, 'steamId'> &
  Partial<
    Pick<
      NewSteamProfile,
      | 'personaName'
      | 'avatarUrl'
      | 'profileUrl'
      | 'visibilityState'
      | 'isPrivate'
      | 'lastSyncedAt'
    >
  >;

export type UpdateSteamProfileSyncStateInput = Partial<
  Pick<NewSteamProfile, 'visibilityState' | 'isPrivate' | 'lastSyncedAt'>
>;

@Injectable()
export class SteamProfilesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findBySteamId(steamId: string): Promise<SteamProfile | null> {
    const rows = await this.databaseService.db
      .select()
      .from(steamProfiles)
      .where(eq(steamProfiles.steamId, steamId))
      .limit(1);

    return rows[0] ?? null;
  }

  async findById(id: string): Promise<SteamProfile | null> {
    const rows = await this.databaseService.db
      .select()
      .from(steamProfiles)
      .where(eq(steamProfiles.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async upsertProfile(input: UpsertSteamProfileInput): Promise<SteamProfile> {
    const rows = await this.databaseService.db
      .insert(steamProfiles)
      .values(input)
      .onConflictDoUpdate({
        target: steamProfiles.steamId,
        set: {
          personaName: input.personaName,
          avatarUrl: input.avatarUrl,
          profileUrl: input.profileUrl,
          visibilityState: input.visibilityState,
          isPrivate: input.isPrivate,
          lastSyncedAt: input.lastSyncedAt,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    return rows[0];
  }

  async updateSyncState(
    id: string,
    input: UpdateSteamProfileSyncStateInput,
  ): Promise<SteamProfile | null> {
    const rows = await this.databaseService.db
      .update(steamProfiles)
      .set({ ...input, updatedAt: sql`now()` })
      .where(eq(steamProfiles.id, id))
      .returning();

    return rows[0] ?? null;
  }
}
