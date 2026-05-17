import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { ProfileAchievementsDataService } from '../../db/services/profile-achievements-data.service';
import type { ProfileGamesDataService } from '../../db/services/profile-games-data.service';
import type { PublicProfilesDataService } from '../../db/services/public-profiles-data.service';
import { PublicProfilesService } from './public-profiles.service';

describe('PublicProfilesService', () => {
  it('returns published profile data without private account/session fields', async () => {
    const service = createService();
    const result = await service.getPublicProfileBySlug('Steam-User');

    expect(result.publicProfile.slug).toBe('steam-user');
    expect(result.steamProfile.steamId).toBe('76561198000000000');
    expect(result.summary.totalGames).toBe(6);
    expect(result.nearestCompletions).toHaveLength(1);
    expect(result.rarestAchievements).toHaveLength(1);
    expect(result).not.toHaveProperty('user');
    expect(JSON.stringify(result)).not.toContain('session');
  });

  it('returns 404 when the slug is missing or private', async () => {
    const service = createService({ publicRow: null });

    await expect(service.getPublicProfileBySlug('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('hides Steam ID and rarest achievements when public settings disable them', async () => {
    const service = createService({
      settings: {
        showSteamId: false,
        showRarestAchievements: false,
        showRecentSyncs: true,
      },
    });
    const result = await service.getPublicProfileBySlug('steam-user');

    expect(result.steamProfile.steamId).toBeNull();
    expect(result.rarestAchievements).toEqual([]);
  });
});

const now = new Date('2026-01-01T00:00:00.000Z');

function createService(input: {
  publicRow?: ReturnType<typeof createPublicRow> | null;
  settings?: Record<string, unknown>;
} = {}): PublicProfilesService {
  const publicRow =
    input.publicRow === undefined
      ? createPublicRow(input.settings)
      : input.publicRow;
  const publicProfilesDataService = {
    findPublicBySlug: vi.fn(async () => publicRow),
  };
  const profileGamesDataService = {
    getProfileGameSummary: vi.fn(async () => ({
      totalGames: 6,
      completedGames: 1,
      totalAchievements: 40,
      unlockedAchievements: 20,
    })),
    getAverageCompletionPercentage: vi.fn(async () => 50),
    findNearestCompletionsWithGames: vi.fn(async () => [
      {
        profileGame: {
          playtimeMinutes: 120,
          playtimeTwoWeeksMinutes: 0,
          totalAchievements: 10,
          unlockedAchievements: 9,
          completionPercentage: 90,
          lastPlayedAt: null,
          lastSyncedAt: now,
        },
        game: {
          steamAppId: 550,
          name: 'Left 4 Dead 2',
          iconUrl: null,
          logoUrl: null,
          hasAchievements: true,
        },
      },
    ]),
  };
  const profileAchievementsDataService = {
    findRarestUnlockedByProfile: vi.fn(async () => [
      {
        profileAchievement: {
          unlockedAt: now,
          lastSyncedAt: now,
        },
        achievement: {
          steamAppId: 550,
          apiName: 'ACH_RARE',
          displayName: 'Rare One',
          description: null,
          iconUrl: null,
          iconGrayUrl: null,
          globalPercentage: 1.5,
          hidden: false,
        },
      },
    ]),
  };

  return new PublicProfilesService(
    publicProfilesDataService as unknown as PublicProfilesDataService,
    profileGamesDataService as unknown as ProfileGamesDataService,
    profileAchievementsDataService as unknown as ProfileAchievementsDataService,
  );
}

function createPublicRow(settings: Record<string, unknown> = {}) {
  return {
    publicProfile: {
      id: 'public-profile-id',
      userId: 'user-id',
      steamProfileId: 'steam-profile-id',
      slug: 'steam-user',
      isPublic: true,
      settings,
      createdAt: now,
      updatedAt: now,
    },
    steamProfile: {
      id: 'steam-profile-id',
      steamId: '76561198000000000',
      personaName: 'Steam Persona',
      avatarUrl: null,
      profileUrl: null,
      visibilityState: 3,
      isPrivate: false,
      lastSyncedAt: now,
      createdAt: now,
      updatedAt: now,
    },
  };
}
