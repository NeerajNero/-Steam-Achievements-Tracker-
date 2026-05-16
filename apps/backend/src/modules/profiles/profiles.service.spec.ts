import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type {
  SteamProfile,
  SteamProfilesDataService,
} from '../../db/services/steam-profiles-data.service';
import type { ProfileGamesDataService } from '../../db/services/profile-games-data.service';
import { ProfilesService } from './profiles.service';

describe('ProfilesService', () => {
  it('throws NotFoundException when the profile is missing', async () => {
    const service = createService({ profile: null });

    await expect(service.getProfileBySteamId('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns a zero-safe dashboard summary', async () => {
    const profile = createProfile();
    const service = createService({ profile });

    await expect(service.getProfileSummary(profile.steamId)).resolves.toEqual({
      steamId: profile.steamId,
      personaName: profile.personaName,
      avatarUrl: profile.avatarUrl,
      visibilityState: profile.visibilityState,
      isPrivate: profile.isPrivate,
      lastSyncedAt: null,
      totalGames: 0,
      completedGames: 0,
      totalAchievements: 0,
      unlockedAchievements: 0,
      remainingAchievements: 0,
      averageCompletionPercentage: 0,
    });
  });
});

function createService(input: { profile: SteamProfile | null }): ProfilesService {
  const steamProfilesDataService = {
    findBySteamId: vi.fn(async () => input.profile),
  };
  const profileGamesDataService = {
    getProfileGameSummary: vi.fn(async () => ({
      totalGames: 0,
      completedGames: 0,
      totalAchievements: 0,
      unlockedAchievements: 0,
    })),
    getAverageCompletionPercentage: vi.fn(async () => 0),
  };

  return new ProfilesService(
    steamProfilesDataService as unknown as SteamProfilesDataService,
    profileGamesDataService as unknown as ProfileGamesDataService,
  );
}

function createProfile(): SteamProfile {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return {
    id: 'profile-id',
    steamId: '76561198000000000',
    personaName: 'Test Profile',
    avatarUrl: 'https://example.com/avatar.jpg',
    profileUrl: 'https://steamcommunity.com/id/test',
    visibilityState: 3,
    isPrivate: false,
    lastSyncedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}
