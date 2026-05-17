import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { ActivityEventsDataService } from '../../db/services/activity-events-data.service';
import type { GamesDataService } from '../../db/services/games-data.service';
import type { GuideAchievementsDataService } from '../../db/services/guide-achievements-data.service';
import type { GuideSectionsDataService } from '../../db/services/guide-sections-data.service';
import type {
  Guide,
  GuidesDataService,
  GuideWithAuthor,
} from '../../db/services/guides-data.service';
import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import { GuideStatusDto, GuideVisibilityDto } from './dto/guide-request.dto';
import { GuidesService } from './guides.service';

describe('GuidesService', () => {
  it('returns only public guide list rows supplied by the data service', async () => {
    const { service } = createService();

    await expect(
      service.listGameGuides(910001, { limit: 20, offset: 0 }),
    ).resolves.toMatchObject({
      total: 1,
      items: [
        {
          steamAppId: 910001,
          title: 'Demo Roadmap',
          status: 'published',
          visibility: 'public',
        },
      ],
    });
  });

  it('creates draft guides for authenticated users with conflict-safe slugs', async () => {
    const { service, guidesDataService } = createService({
      editableGuide: createGuide(),
      slugExistsValues: [true, false],
    });

    const result = await service.createGameGuide(910001, userContext(), {
      title: 'Demo Roadmap',
      summary: 'Route notes',
      visibility: GuideVisibilityDto.Public,
      isSpoilerHeavy: false,
    });

    expect(guidesDataService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        authorUserId: 'user-id',
        slug: 'demo-roadmap-2',
        title: 'Demo Roadmap',
      }),
    );
    expect(result.status).toBe('draft');
  });

  it('rejects non-author guide updates', async () => {
    const { service } = createService({
      editableGuide: createGuide({ authorUserId: 'other-user' }),
    });

    await expect(
      service.updateGuide('guide-id', userContext(), { title: 'New title' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows moderator guide updates and sets publishedAt on first publish', async () => {
    const { service, guidesDataService, activityEventsDataService } = createService({
      editableGuide: createGuide(),
    });

    await service.updateGuide('guide-id', userContext({ role: 'moderator' }), {
      status: GuideStatusDto.Published,
    });

    expect(guidesDataService.update).toHaveBeenCalledWith(
      'guide-id',
      expect.objectContaining({
        status: 'published',
        publishedAt: expect.any(Date),
      }),
    );
    expect(activityEventsDataService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'user-id',
        eventType: 'guide_published',
        entityType: 'guide',
        entityId: 'guide-id',
        steamAppId: 910001,
      }),
    );
  });

  it('adds only same-game achievements to a guide', async () => {
    const { service, guideAchievementsDataService } = createService();

    await expect(
      service.addGuideAchievements('guide-id', userContext(), {
        achievementIds: ['achievement-id', 'achievement-id'],
      }),
    ).resolves.toEqual({ added: 1 });

    expect(guideAchievementsDataService.addMany).toHaveBeenCalledWith('guide-id', [
      'achievement-id',
    ]);
  });

  it('rejects achievement mappings from another game', async () => {
    const { service } = createService({ validAchievementIds: [] });

    await expect(
      service.addGuideAchievements('guide-id', userContext(), {
        achievementIds: ['achievement-id'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 when the game is not tracked', async () => {
    const { service } = createService({ gameExists: false });

    await expect(
      service.listGameGuides(999999, { limit: 20, offset: 0 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists only the current account guides from the data service', async () => {
    const { service, guidesDataService } = createService();

    await service.listAccountGuides(userContext());

    expect(guidesDataService.findByAuthorUserId).toHaveBeenCalledWith('user-id');
  });
});

const now = new Date('2026-01-01T00:00:00.000Z');

function createService(
  options: {
    gameExists?: boolean;
    editableGuide?: Guide;
    slugExistsValues?: boolean[];
    validAchievementIds?: string[];
  } = {},
) {
  const guideRow = createGuideWithAuthor(
    options.editableGuide ??
      createGuide({ status: 'published', publishedAt: now }),
  );
  const slugExistsValues = [...(options.slugExistsValues ?? [false])];
  const guidesDataService = {
    findPublicGuidesForGame: vi.fn(async () => [guideRow]),
    countPublicGuidesForGame: vi.fn(async () => 1),
    findPublicGuideBySlug: vi.fn(async () => guideRow),
    findById: vi.fn(async () => options.editableGuide ?? guideRow.guide),
    findByIdWithAuthor: vi.fn(async () => guideRow),
    findByAuthorUserId: vi.fn(async () => [guideRow]),
    slugExists: vi.fn(async () => slugExistsValues.shift() ?? false),
    create: vi.fn(async () => guideRow.guide),
    update: vi.fn(async () => guideRow.guide),
  };
  const guideSectionsDataService = {
    findByGuideId: vi.fn(async () => [
      {
        id: 'section-id',
        guideId: 'guide-id',
        title: 'Route',
        content: 'Start here.',
        position: 0,
        createdAt: now,
        updatedAt: now,
      },
    ]),
    create: vi.fn(async () => ({
      id: 'section-id',
      guideId: 'guide-id',
      title: 'Route',
      content: 'Start here.',
      position: 0,
      createdAt: now,
      updatedAt: now,
    })),
    update: vi.fn(async () => ({
      id: 'section-id',
      guideId: 'guide-id',
      title: 'Route',
      content: 'Start here.',
      position: 0,
      createdAt: now,
      updatedAt: now,
    })),
  };
  const guideAchievementsDataService = {
    findByGuideId: vi.fn(async () => [
      {
        mapping: {
          id: 'mapping-id',
          guideId: 'guide-id',
          achievementId: 'achievement-id',
          note: null,
          createdAt: now,
        },
        achievement: {
          id: 'achievement-id',
          steamAppId: 910001,
          apiName: 'ACH_ONE',
          displayName: 'First Step',
          description: 'Start playing.',
          iconUrl: null,
          iconGrayUrl: null,
          hidden: false,
          globalPercentage: 12.3,
          createdAt: now,
          updatedAt: now,
        },
      },
    ]),
    findAchievementIdsForSteamApp: vi.fn(async () =>
      options.validAchievementIds ?? ['achievement-id'],
    ),
    addMany: vi.fn(async (_guideId: string, achievementIds: string[]) =>
      achievementIds.map((achievementId) => ({
        id: `mapping-${achievementId}`,
        guideId: 'guide-id',
        achievementId,
        note: null,
        createdAt: now,
      })),
    ),
    remove: vi.fn(async () => true),
  };
  const gamesDataService = {
    findBySteamAppId: vi.fn(async () =>
      options.gameExists === false
        ? null
        : {
            id: 'game-id',
            steamAppId: 910001,
            name: 'Demo Complete Quest',
            iconUrl: null,
            logoUrl: null,
            hasAchievements: true,
            createdAt: now,
            updatedAt: now,
          },
    ),
  };
  const activityEventsDataService = {
    create: vi.fn(async () => ({
      id: 'activity-id',
    })),
  };

  return {
    service: new GuidesService(
      guidesDataService as unknown as GuidesDataService,
      guideSectionsDataService as unknown as GuideSectionsDataService,
      guideAchievementsDataService as unknown as GuideAchievementsDataService,
      gamesDataService as unknown as GamesDataService,
      activityEventsDataService as unknown as ActivityEventsDataService,
    ),
    guidesDataService,
    guideAchievementsDataService,
    activityEventsDataService,
  };
}

function createGuide(overrides: Partial<Guide> = {}): Guide {
  return {
    id: 'guide-id',
    steamAppId: 910001,
    authorUserId: 'user-id',
    title: 'Demo Roadmap',
    slug: 'demo-roadmap',
    summary: 'Route notes',
    status: 'draft',
    visibility: 'public',
    estimatedDifficulty: null,
    estimatedHours: null,
    isSpoilerHeavy: false,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createGuideWithAuthor(guide = createGuide()): GuideWithAuthor {
  return {
    guide,
    author: {
      id: guide.authorUserId,
      displayName: 'Author',
      avatarUrl: null,
      role: 'user',
    },
    game: {
      steamAppId: guide.steamAppId,
      name: 'Demo Complete Quest',
      iconUrl: null,
      logoUrl: null,
    },
  };
}

function userContext(
  overrides: { userId?: string; role?: string } = {},
): AuthenticatedUserContext {
  const userId = overrides.userId ?? 'user-id';
  return {
    userId,
    user: {
      id: userId,
      displayName: 'Author',
      avatarUrl: null,
      role: overrides.role ?? 'user',
      status: 'active',
    },
    steamAccount: null,
    publicProfile: null,
  };
}
