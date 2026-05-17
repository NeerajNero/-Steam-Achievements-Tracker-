import { Injectable } from '@nestjs/common';
import { asc, eq, inArray } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { badges } from '../schema';

export type Badge = InferSelectModel<typeof badges>;
export type BadgeType = 'milestone' | 'completion' | 'rarity' | 'community' | 'special';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

@Injectable()
export class BadgesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findActive(): Promise<Badge[]> {
    return this.databaseService.db
      .select()
      .from(badges)
      .where(eq(badges.isActive, true))
      .orderBy(asc(badges.sortOrder), asc(badges.name));
  }

  async findActiveByCode(code: string): Promise<Badge | null> {
    const rows = await this.databaseService.db
      .select()
      .from(badges)
      .where(eq(badges.code, code))
      .limit(1);

    const badge = rows[0] ?? null;
    return badge?.isActive === true ? badge : null;
  }

  async findActiveByCodes(codes: string[]): Promise<Badge[]> {
    if (codes.length === 0) {
      return [];
    }

    return this.databaseService.db
      .select()
      .from(badges)
      .where(inArray(badges.code, codes))
      .orderBy(asc(badges.sortOrder), asc(badges.name));
  }
}
