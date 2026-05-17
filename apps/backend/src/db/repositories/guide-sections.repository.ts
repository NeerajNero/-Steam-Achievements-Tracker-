import { Injectable } from '@nestjs/common';
import { asc, eq, sql, and } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { DatabaseService } from '../database.service';
import { guideSections } from '../schema';

export type GuideSection = InferSelectModel<typeof guideSections>;
export type NewGuideSection = InferInsertModel<typeof guideSections>;

export interface CreateGuideSectionInput {
  guideId: string;
  title: string;
  content: string;
  position?: number;
}

export interface UpdateGuideSectionInput {
  title?: string;
  content?: string;
  position?: number;
}

@Injectable()
export class GuideSectionsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByGuideId(guideId: string): Promise<GuideSection[]> {
    return this.databaseService.db
      .select()
      .from(guideSections)
      .where(eq(guideSections.guideId, guideId))
      .orderBy(asc(guideSections.position), asc(guideSections.createdAt));
  }

  async findByIdAndGuideId(
    id: string,
    guideId: string,
  ): Promise<GuideSection | null> {
    const rows = await this.databaseService.db
      .select()
      .from(guideSections)
      .where(and(eq(guideSections.id, id), eq(guideSections.guideId, guideId)))
      .limit(1);

    return rows[0] ?? null;
  }

  async create(input: CreateGuideSectionInput): Promise<GuideSection> {
    const rows = await this.databaseService.db
      .insert(guideSections)
      .values({
        guideId: input.guideId,
        title: input.title,
        content: input.content,
        position: input.position ?? 0,
      })
      .returning();

    return rows[0];
  }

  async update(
    id: string,
    guideId: string,
    input: UpdateGuideSectionInput,
  ): Promise<GuideSection | null> {
    const rows = await this.databaseService.db
      .update(guideSections)
      .set({
        ...input,
        updatedAt: sql`now()`,
      })
      .where(and(eq(guideSections.id, id), eq(guideSections.guideId, guideId)))
      .returning();

    return rows[0] ?? null;
  }
}
