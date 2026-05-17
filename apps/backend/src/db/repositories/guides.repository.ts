import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, ilike, ne, or, sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel, SQL } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { appUsers, games, guides } from '../schema';

export type Guide = InferSelectModel<typeof guides>;
export type NewGuide = InferInsertModel<typeof guides>;

export type GuideStatus = 'draft' | 'published' | 'archived';
export type GuideVisibility = 'public' | 'unlisted' | 'private';

export interface GuideListFilters {
  steamAppId: number;
  search?: string;
  limit: number;
  offset: number;
}

export interface CreateGuideInput {
  steamAppId: number;
  authorUserId: string;
  title: string;
  slug: string;
  summary?: string | null;
  visibility?: GuideVisibility;
  estimatedDifficulty?: number | null;
  estimatedHours?: number | null;
  isSpoilerHeavy?: boolean;
}

export interface UpdateGuideInput {
  title?: string;
  slug?: string;
  summary?: string | null;
  visibility?: GuideVisibility;
  estimatedDifficulty?: number | null;
  estimatedHours?: number | null;
  isSpoilerHeavy?: boolean;
  status?: GuideStatus;
  publishedAt?: Date | null;
}

export interface GuideWithAuthor {
  guide: Guide;
  author: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    role: string;
  };
  game: {
    steamAppId: number;
    name: string;
    iconUrl: string | null;
    logoUrl: string | null;
  };
}

@Injectable()
export class GuidesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findPublicGuidesForGame(
    filters: GuideListFilters,
  ): Promise<GuideWithAuthor[]> {
    return this.databaseService.db
      .select({
        guide: guides,
        author: {
          id: appUsers.id,
          displayName: appUsers.displayName,
          avatarUrl: appUsers.avatarUrl,
          role: appUsers.role,
        },
        game: {
          steamAppId: games.steamAppId,
          name: games.name,
          iconUrl: games.iconUrl,
          logoUrl: games.logoUrl,
        },
      })
      .from(guides)
      .innerJoin(appUsers, eq(appUsers.id, guides.authorUserId))
      .innerJoin(games, eq(games.steamAppId, guides.steamAppId))
      .where(and(...this.buildPublicListConditions(filters)))
      .orderBy(desc(guides.publishedAt), desc(guides.createdAt), asc(guides.title))
      .limit(filters.limit)
      .offset(filters.offset);
  }

  async countPublicGuidesForGame(
    filters: Pick<GuideListFilters, 'steamAppId' | 'search'>,
  ): Promise<number> {
    const rows = await this.databaseService.db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(guides)
      .where(and(...this.buildPublicListConditions(filters)));

    return rows[0]?.total ?? 0;
  }

  async findPublicGuideBySlug(
    steamAppId: number,
    slug: string,
  ): Promise<GuideWithAuthor | null> {
    const rows = await this.databaseService.db
      .select({
        guide: guides,
        author: {
          id: appUsers.id,
          displayName: appUsers.displayName,
          avatarUrl: appUsers.avatarUrl,
          role: appUsers.role,
        },
        game: {
          steamAppId: games.steamAppId,
          name: games.name,
          iconUrl: games.iconUrl,
          logoUrl: games.logoUrl,
        },
      })
      .from(guides)
      .innerJoin(appUsers, eq(appUsers.id, guides.authorUserId))
      .innerJoin(games, eq(games.steamAppId, guides.steamAppId))
      .where(
        and(
          eq(guides.steamAppId, steamAppId),
          eq(guides.slug, slug),
          eq(guides.status, 'published'),
          eq(guides.visibility, 'public'),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async findById(id: string): Promise<Guide | null> {
    const rows = await this.databaseService.db
      .select()
      .from(guides)
      .where(eq(guides.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async findByIdWithAuthor(id: string): Promise<GuideWithAuthor | null> {
    const rows = await this.databaseService.db
      .select({
        guide: guides,
        author: {
          id: appUsers.id,
          displayName: appUsers.displayName,
          avatarUrl: appUsers.avatarUrl,
          role: appUsers.role,
        },
        game: {
          steamAppId: games.steamAppId,
          name: games.name,
          iconUrl: games.iconUrl,
          logoUrl: games.logoUrl,
        },
      })
      .from(guides)
      .innerJoin(appUsers, eq(appUsers.id, guides.authorUserId))
      .innerJoin(games, eq(games.steamAppId, guides.steamAppId))
      .where(eq(guides.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async findByAuthorUserId(authorUserId: string): Promise<GuideWithAuthor[]> {
    return this.databaseService.db
      .select({
        guide: guides,
        author: {
          id: appUsers.id,
          displayName: appUsers.displayName,
          avatarUrl: appUsers.avatarUrl,
          role: appUsers.role,
        },
        game: {
          steamAppId: games.steamAppId,
          name: games.name,
          iconUrl: games.iconUrl,
          logoUrl: games.logoUrl,
        },
      })
      .from(guides)
      .innerJoin(appUsers, eq(appUsers.id, guides.authorUserId))
      .innerJoin(games, eq(games.steamAppId, guides.steamAppId))
      .where(eq(guides.authorUserId, authorUserId))
      .orderBy(desc(guides.updatedAt), asc(guides.title));
  }

  async slugExists(
    steamAppId: number,
    slug: string,
    excludeGuideId?: string,
  ): Promise<boolean> {
    const conditions: SQL[] = [
      eq(guides.steamAppId, steamAppId),
      eq(guides.slug, slug),
    ];

    if (excludeGuideId !== undefined) {
      conditions.push(ne(guides.id, excludeGuideId));
    }

    const rows = await this.databaseService.db
      .select({ id: guides.id })
      .from(guides)
      .where(and(...conditions))
      .limit(1);

    return rows.length > 0;
  }

  async create(input: CreateGuideInput): Promise<Guide> {
    const rows = await this.databaseService.db
      .insert(guides)
      .values({
        steamAppId: input.steamAppId,
        authorUserId: input.authorUserId,
        title: input.title,
        slug: input.slug,
        summary: input.summary,
        visibility: input.visibility ?? 'public',
        estimatedDifficulty: input.estimatedDifficulty,
        estimatedHours: input.estimatedHours,
        isSpoilerHeavy: input.isSpoilerHeavy ?? false,
      })
      .returning();

    return rows[0];
  }

  async update(id: string, input: UpdateGuideInput): Promise<Guide | null> {
    const rows = await this.databaseService.db
      .update(guides)
      .set({
        ...input,
        updatedAt: sql`now()`,
      })
      .where(eq(guides.id, id))
      .returning();

    return rows[0] ?? null;
  }

  private buildPublicListConditions(
    filters: Pick<GuideListFilters, 'steamAppId' | 'search'>,
  ): SQL[] {
    const conditions: SQL[] = [
      eq(guides.steamAppId, filters.steamAppId),
      eq(guides.status, 'published'),
      eq(guides.visibility, 'public'),
    ];

    if (filters.search !== undefined && filters.search.trim().length > 0) {
      const search = `%${filters.search.trim()}%`;
      conditions.push(
        or(ilike(guides.title, search), ilike(guides.summary, search)) as SQL,
      );
    }

    return conditions;
  }
}
