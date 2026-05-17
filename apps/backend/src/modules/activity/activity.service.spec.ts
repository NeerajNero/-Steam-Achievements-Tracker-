import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { ActivityEventsDataService } from '../../db/services/activity-events-data.service';
import type { GamesDataService } from '../../db/services/games-data.service';
import type { SteamProfilesDataService } from '../../db/services/steam-profiles-data.service';
import { ActivityEventTypeDto } from './dto/activity-query.dto';
import { ActivityService } from './activity.service';

describe('ActivityService', () => {
  it('lists public activity events from the data service', async () => {
    const { service, activityEventsDataService } = createService();

    await expect(
      service.listActivity({
        eventType: ActivityEventTypeDto.GuidePublished,
        limit: 30,
        offset: 0,
      }),
    ).resolves.toMatchObject({
      total: 1,
      items: [{ eventType: 'guide_published', entityType: 'guide' }],
    });

    expect(activityEventsDataService.findPublic).toHaveBeenCalledWith({
      eventType: 'guide_published',
      limit: 30,
      offset: 0,
    });
  });

  it('filters profile activity by stored Steam profile id', async () => {
    const { service, activityEventsDataService } = createService();

    await service.listProfileActivity('76561198000000000', {
      limit: 10,
      offset: 0,
    });

    expect(activityEventsDataService.findPublic).toHaveBeenCalledWith({
      steamProfileId: 'profile-id',
      limit: 10,
      offset: 0,
    });
  });

  it('filters game activity by Steam app id', async () => {
    const { service, activityEventsDataService } = createService();

    await service.listGameActivity(910001, { limit: 10, offset: 0 });

    expect(activityEventsDataService.findPublic).toHaveBeenCalledWith({
      steamAppId: 910001,
      limit: 10,
      offset: 0,
    });
  });

  it('returns 404 for missing profile activity', async () => {
    const { service } = createService({ missingProfile: true });

    await expect(
      service.listProfileActivity('76561198000000000', { limit: 10, offset: 0 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 for missing game activity', async () => {
    const { service } = createService({ missingGame: true });

    await expect(
      service.listGameActivity(910001, { limit: 10, offset: 0 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

const now = new Date('2026-01-01T00:00:00.000Z');

function createService(
  options: { missingProfile?: boolean; missingGame?: boolean } = {},
) {
  const activityEventsDataService = {
    create: vi.fn(async () => createActivityRow().event),
    findPublic: vi.fn(async () => [createActivityRow()]),
    countPublic: vi.fn(async () => 1),
  };
  const steamProfilesDataService = {
    findBySteamId: vi.fn(async () =>
      options.missingProfile
        ? null
        : {
            id: 'profile-id',
            steamId: '76561198000000000',
          },
    ),
  };
  const gamesDataService = {
    findBySteamAppId: vi.fn(async () =>
      options.missingGame
        ? null
        : {
            id: 'game-id',
            steamAppId: 910001,
          },
    ),
  };

  return {
    service: new ActivityService(
      activityEventsDataService as unknown as ActivityEventsDataService,
      steamProfilesDataService as unknown as SteamProfilesDataService,
      gamesDataService as unknown as GamesDataService,
    ),
    activityEventsDataService,
  };
}

function createActivityRow() {
  return {
    event: {
      id: 'activity-id',
      actorUserId: 'user-id',
      steamProfileId: 'profile-id',
      eventType: 'guide_published',
      visibility: 'public',
      entityType: 'guide',
      entityId: 'guide-id',
      steamAppId: 910001,
      metadata: { title: 'Demo Roadmap' },
      occurredAt: now,
      createdAt: now,
    },
    actor: {
      displayName: 'Steam User',
      steamId: '76561198000000000',
      avatarUrl: null,
      publicSlug: 'nero',
    },
    steamProfile: {
      steamId: '76561198000000000',
      personaName: 'Steam User',
      avatarUrl: null,
    },
  };
}
