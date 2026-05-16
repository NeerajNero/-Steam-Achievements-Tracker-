import { describe, expect, it, vi } from 'vitest';

import type { ProfileAchievementsDataService } from '../../db/services/profile-achievements-data.service';
import type { ProfileGamesDataService } from '../../db/services/profile-games-data.service';
import type { SteamProfile } from '../../db/services/steam-profiles-data.service';
import type { ProfilesService } from '../profiles/profiles.service';
import { LimitQueryDto } from '../games/dto/limit-query.dto';
import { AchievementListQueryDto } from './dto/achievement-list-query.dto';
import { AchievementsService } from './achievements.service';

describe('AchievementsService', () => {
  it('returns unknown unlock state when metadata exists without a profile achievement row', async () => {
    const profile = createProfile();
    const service = new AchievementsService(
      {
        resolveProfile: vi.fn(async () => profile),
      } as unknown as ProfilesService,
      {
        findProfileGameBySteamAppId: vi.fn(async () => ({
          profileGame: {},
          game: {},
        })),
      } as unknown as ProfileGamesDataService,
      {
        findAchievementsWithUnlockState: vi.fn(async () => [
          {
            achievement: {
              id: 'achievement-id',
              steamAppId: 550,
              apiName: 'ACH_UNKNOWN',
              displayName: 'Unknown',
              description: null,
              iconUrl: null,
              iconGrayUrl: null,
              globalPercentage: 12.3,
              hidden: false,
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
              updatedAt: new Date('2026-01-01T00:00:00.000Z'),
            },
            profileAchievement: null,
          },
        ]),
      } as unknown as ProfileAchievementsDataService,
    );

    await expect(
      service.getGameAchievements(profile.steamId, 550, new AchievementListQueryDto()),
    ).resolves.toMatchObject({
      steamId: profile.steamId,
      steamAppId: 550,
      items: [
        {
          apiName: 'ACH_UNKNOWN',
          achieved: false,
          unlockState: 'unknown',
          unlockedAt: null,
          lastSyncedAt: null,
        },
      ],
    });
  });

  it('returns rarest achievements in repository order', async () => {
    const profile = createProfile();
    const service = new AchievementsService(
      {
        resolveProfile: vi.fn(async () => profile),
      } as unknown as ProfilesService,
      {} as ProfileGamesDataService,
      {
        findRarestUnlockedByProfile: vi.fn(async () => [
          createRarestAchievement('rare', 0.5),
          createRarestAchievement('less_rare', 3.4),
        ]),
      } as unknown as ProfileAchievementsDataService,
    );
    const query = new LimitQueryDto();
    query.limit = 2;

    await expect(
      service.getRarestUnlockedAchievements(profile.steamId, query),
    ).resolves.toMatchObject({
      steamId: profile.steamId,
      items: [
        { apiName: 'rare', globalPercentage: 0.5 },
        { apiName: 'less_rare', globalPercentage: 3.4 },
      ],
    });
  });
});

function createProfile(): SteamProfile {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return {
    id: 'profile-id',
    steamId: '76561198000000000',
    personaName: 'Test Profile',
    avatarUrl: null,
    profileUrl: null,
    visibilityState: 3,
    isPrivate: false,
    lastSyncedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function createRarestAchievement(apiName: string, globalPercentage: number) {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return {
    profileAchievement: {
      id: `profile-achievement-${apiName}`,
      profileId: 'profile-id',
      achievementId: `achievement-${apiName}`,
      achieved: true,
      unlockedAt: now,
      lastSyncedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    achievement: {
      id: `achievement-${apiName}`,
      steamAppId: 10,
      apiName,
      displayName: apiName,
      description: null,
      iconUrl: null,
      iconGrayUrl: null,
      globalPercentage,
      hidden: false,
    },
  };
}
