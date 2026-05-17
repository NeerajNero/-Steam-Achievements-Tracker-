import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  GuidesDataService,
  type Guide,
  type GuideStatus,
  type GuideWithAuthor,
} from '../../db/services/guides-data.service';
import {
  GuideSectionsDataService,
  type GuideSection,
} from '../../db/services/guide-sections-data.service';
import {
  GuideAchievementsDataService,
  type GuideAchievementWithAchievement,
} from '../../db/services/guide-achievements-data.service';
import { GamesDataService } from '../../db/services/games-data.service';
import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import { createGuideSlug } from './guide-slug.util';
import type { GuideListQueryDto } from './dto/guide-list-query.dto';
import type {
  AddGuideAchievementsDto,
  CreateGuideDto,
  CreateGuideSectionDto,
  UpdateGuideDto,
  UpdateGuideSectionDto,
} from './dto/guide-request.dto';
import type {
  AccountGuidesResponseDto,
  AddGuideAchievementsResponseDto,
  GuideAchievementResponseDto,
  GuideDetailResponseDto,
  GuideListResponseDto,
  GuideSectionResponseDto,
  GuideSummaryResponseDto,
} from './dto/guide-response.dto';

@Injectable()
export class GuidesService {
  constructor(
    private readonly guidesDataService: GuidesDataService,
    private readonly guideSectionsDataService: GuideSectionsDataService,
    private readonly guideAchievementsDataService: GuideAchievementsDataService,
    private readonly gamesDataService: GamesDataService,
  ) {}

  async listGameGuides(
    steamAppId: number,
    query: GuideListQueryDto,
  ): Promise<GuideListResponseDto> {
    await this.ensureGameExists(steamAppId);

    const filters = {
      steamAppId,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
    };
    const [items, total] = await Promise.all([
      this.guidesDataService.findPublicGuidesForGame(filters),
      this.guidesDataService.countPublicGuidesForGame(filters),
    ]);

    return {
      items: items.map(mapGuideSummary),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async getGameGuide(
    steamAppId: number,
    slug: string,
  ): Promise<GuideDetailResponseDto> {
    await this.ensureGameExists(steamAppId);
    const guide = await this.guidesDataService.findPublicGuideBySlug(
      steamAppId,
      slug,
    );

    if (guide === null) {
      throw new NotFoundException('Guide was not found.');
    }

    return this.buildGuideDetail(guide);
  }

  async createGameGuide(
    steamAppId: number,
    currentUser: AuthenticatedUserContext,
    input: CreateGuideDto,
  ): Promise<GuideDetailResponseDto> {
    await this.ensureGameExists(steamAppId);
    const title = input.title.trim();
    const slug = await this.generateUniqueSlug(steamAppId, title);
    const guide = await this.guidesDataService.create({
      steamAppId,
      authorUserId: currentUser.userId,
      title,
      slug,
      summary: normalizeNullableText(input.summary),
      visibility: input.visibility,
      estimatedDifficulty: input.estimatedDifficulty,
      estimatedHours: input.estimatedHours,
      isSpoilerHeavy: input.isSpoilerHeavy,
    });

    const row = await this.guidesDataService.findByIdWithAuthor(guide.id);

    if (row === null) {
      throw new NotFoundException('Guide was not found after creation.');
    }

    return this.buildGuideDetail(row);
  }

  async updateGuide(
    guideId: string,
    currentUser: AuthenticatedUserContext,
    input: UpdateGuideDto,
  ): Promise<GuideDetailResponseDto> {
    const guide = await this.resolveEditableGuide(guideId, currentUser);
    const nextStatus = input.status;
    const update: Parameters<GuidesDataService['update']>[1] = {
      title: input.title === undefined ? undefined : input.title.trim(),
      summary:
        input.summary === undefined
          ? undefined
          : normalizeNullableText(input.summary),
      visibility: input.visibility,
      estimatedDifficulty: input.estimatedDifficulty,
      estimatedHours: input.estimatedHours,
      isSpoilerHeavy: input.isSpoilerHeavy,
      status: nextStatus,
    };

    if (input.title !== undefined && input.title.trim() !== guide.title) {
      update.slug = await this.generateUniqueSlug(
        guide.steamAppId,
        input.title,
        guide.id,
      );
    }

    if (nextStatus === 'published' && guide.publishedAt === null) {
      update.publishedAt = new Date();
    }

    const updated = await this.guidesDataService.update(guideId, update);

    if (updated === null) {
      throw new NotFoundException('Guide was not found.');
    }

    const row = await this.guidesDataService.findByIdWithAuthor(updated.id);

    if (row === null) {
      throw new NotFoundException('Guide was not found.');
    }

    return this.buildGuideDetail(row);
  }

  async listAccountGuides(
    currentUser: AuthenticatedUserContext,
  ): Promise<AccountGuidesResponseDto> {
    const items = await this.guidesDataService.findByAuthorUserId(
      currentUser.userId,
    );

    return { items: items.map(mapGuideSummary) };
  }

  async createGuideSection(
    guideId: string,
    currentUser: AuthenticatedUserContext,
    input: CreateGuideSectionDto,
  ): Promise<GuideSectionResponseDto> {
    await this.resolveEditableGuide(guideId, currentUser);
    const section = await this.guideSectionsDataService.create({
      guideId,
      title: input.title.trim(),
      content: input.content.trim(),
      position: input.position,
    });

    return mapSection(section);
  }

  async updateGuideSection(
    guideId: string,
    sectionId: string,
    currentUser: AuthenticatedUserContext,
    input: UpdateGuideSectionDto,
  ): Promise<GuideSectionResponseDto> {
    await this.resolveEditableGuide(guideId, currentUser);
    const updated = await this.guideSectionsDataService.update(
      sectionId,
      guideId,
      {
        title: input.title === undefined ? undefined : input.title.trim(),
        content: input.content === undefined ? undefined : input.content.trim(),
        position: input.position,
      },
    );

    if (updated === null) {
      throw new NotFoundException('Guide section was not found.');
    }

    return mapSection(updated);
  }

  async addGuideAchievements(
    guideId: string,
    currentUser: AuthenticatedUserContext,
    input: AddGuideAchievementsDto,
  ): Promise<AddGuideAchievementsResponseDto> {
    const guide = await this.resolveEditableGuide(guideId, currentUser);
    const uniqueIds = Array.from(new Set(input.achievementIds));
    const validIds =
      await this.guideAchievementsDataService.findAchievementIdsForSteamApp(
        guide.steamAppId,
        uniqueIds,
      );

    if (validIds.length !== uniqueIds.length) {
      throw new BadRequestException(
        'All achievements must belong to the same Steam game as the guide.',
      );
    }

    const rows = await this.guideAchievementsDataService.addMany(guideId, validIds);

    return { added: rows.length };
  }

  async removeGuideAchievement(
    guideId: string,
    achievementId: string,
    currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    const guide = await this.resolveEditableGuide(guideId, currentUser);
    const validIds =
      await this.guideAchievementsDataService.findAchievementIdsForSteamApp(
        guide.steamAppId,
        [achievementId],
      );

    if (validIds.length !== 1) {
      throw new BadRequestException(
        'Achievement must belong to the same Steam game as the guide.',
      );
    }

    await this.guideAchievementsDataService.remove(guideId, achievementId);
  }

  private async buildGuideDetail(
    guide: GuideWithAuthor,
  ): Promise<GuideDetailResponseDto> {
    const [sections, achievements] = await Promise.all([
      this.guideSectionsDataService.findByGuideId(guide.guide.id),
      this.guideAchievementsDataService.findByGuideId(guide.guide.id),
    ]);

    return {
      ...mapGuideSummary(guide),
      sections: sections.map(mapSection),
      achievements: achievements.map(mapGuideAchievement),
    };
  }

  private async resolveEditableGuide(
    guideId: string,
    currentUser: AuthenticatedUserContext,
  ): Promise<Guide> {
    const guide = await this.guidesDataService.findById(guideId);

    if (guide === null) {
      throw new NotFoundException('Guide was not found.');
    }

    if (!canEditGuide(currentUser, guide)) {
      throw new ForbiddenException('You can edit only your own guides.');
    }

    return guide;
  }

  private async ensureGameExists(steamAppId: number): Promise<void> {
    const game = await this.gamesDataService.findBySteamAppId(steamAppId);

    if (game === null) {
      throw new NotFoundException(`Game ${steamAppId} was not found.`);
    }
  }

  private async generateUniqueSlug(
    steamAppId: number,
    title: string,
    excludeGuideId?: string,
  ): Promise<string> {
    const baseSlug = createGuideSlug(title);

    for (let index = 0; index < 100; index += 1) {
      const suffix = index === 0 ? '' : `-${index + 1}`;
      const candidate = `${baseSlug.slice(0, 80 - suffix.length)}${suffix}`;
      const exists = await this.guidesDataService.slugExists(
        steamAppId,
        candidate,
        excludeGuideId,
      );

      if (!exists) {
        return candidate;
      }
    }

    throw new BadRequestException('Could not generate a unique guide slug.');
  }
}

function canEditGuide(
  currentUser: AuthenticatedUserContext,
  guide: Pick<Guide, 'authorUserId'>,
): boolean {
  return (
    currentUser.userId === guide.authorUserId ||
    currentUser.user.role === 'admin' ||
    currentUser.user.role === 'moderator'
  );
}

function mapGuideSummary(row: GuideWithAuthor): GuideSummaryResponseDto {
  return {
    id: row.guide.id,
    steamAppId: row.guide.steamAppId,
    title: row.guide.title,
    slug: row.guide.slug,
    summary: row.guide.summary,
    status: row.guide.status,
    visibility: row.guide.visibility,
    estimatedDifficulty: row.guide.estimatedDifficulty,
    estimatedHours: row.guide.estimatedHours,
    isSpoilerHeavy: row.guide.isSpoilerHeavy,
    publishedAt: toIsoOrNull(row.guide.publishedAt),
    createdAt: row.guide.createdAt.toISOString(),
    updatedAt: row.guide.updatedAt.toISOString(),
    author: {
      id: row.author.id,
      displayName: row.author.displayName,
      avatarUrl: row.author.avatarUrl,
    },
    game: row.game,
  };
}

function mapSection(section: GuideSection): GuideSectionResponseDto {
  return {
    id: section.id,
    title: section.title,
    content: section.content,
    position: section.position,
    createdAt: section.createdAt.toISOString(),
    updatedAt: section.updatedAt.toISOString(),
  };
}

function mapGuideAchievement(
  row: GuideAchievementWithAchievement,
): GuideAchievementResponseDto {
  return {
    id: row.achievement.id,
    apiName: row.achievement.apiName,
    displayName: row.achievement.displayName,
    description: row.achievement.description,
    iconUrl: row.achievement.iconUrl,
    iconGrayUrl: row.achievement.iconGrayUrl,
    hidden: row.achievement.hidden,
    globalPercentage: row.achievement.globalPercentage,
  };
}

function normalizeNullableText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toIsoOrNull(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}
