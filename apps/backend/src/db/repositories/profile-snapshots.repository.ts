import { Injectable } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { profileSnapshots } from '../schema';

export type ProfileSnapshot = InferSelectModel<typeof profileSnapshots>;
export type SnapshotReason = 'manual' | 'sync_completed' | 'scheduled';

@Injectable()
export class ProfileSnapshotsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createForProfileId(
    steamProfileId: string,
    reason: SnapshotReason,
  ): Promise<ProfileSnapshot | null> {
    const result = await this.databaseService.db.execute(
      sql<{ id: string }>`select create_profile_snapshot(${steamProfileId}, ${reason}) as id`,
    );
    const row = result.rows[0] as { id?: string } | undefined;
    const snapshotId = row?.id;

    if (snapshotId === undefined) {
      return null;
    }

    return this.findById(snapshotId);
  }

  async findById(id: string): Promise<ProfileSnapshot | null> {
    const rows = await this.databaseService.db
      .select()
      .from(profileSnapshots)
      .where(eq(profileSnapshots.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async findBySteamProfileId(
    steamProfileId: string,
    input: { limit: number; offset: number },
  ): Promise<ProfileSnapshot[]> {
    return this.databaseService.db
      .select()
      .from(profileSnapshots)
      .where(eq(profileSnapshots.steamProfileId, steamProfileId))
      .orderBy(desc(profileSnapshots.createdAt), desc(profileSnapshots.id))
      .limit(input.limit)
      .offset(input.offset);
  }

  async countBySteamProfileId(steamProfileId: string): Promise<number> {
    const rows = await this.databaseService.db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(profileSnapshots)
      .where(eq(profileSnapshots.steamProfileId, steamProfileId));

    return rows[0]?.total ?? 0;
  }
}
