import { Injectable, NotFoundException } from '@nestjs/common';

import {
  SteamProfilesDataService,
  type SteamProfile,
} from '../../db/services/steam-profiles-data.service';
import { ProfileGamesDataService } from '../../db/services/profile-games-data.service';
import type { ProfileDetailResponseDto } from './dto/profile-detail-response.dto';
import type { ProfileSummaryResponseDto } from './dto/profile-summary-response.dto';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly steamProfilesDataService: SteamProfilesDataService,
    private readonly profileGamesDataService: ProfileGamesDataService,
  ) {}

  async getProfileBySteamId(steamId: string): Promise<ProfileDetailResponseDto> {
    const profile = await this.resolveProfile(steamId);

    return this.mapProfileDetail(profile);
  }

  async getProfileSummary(steamId: string): Promise<ProfileSummaryResponseDto> {
    const profile = await this.resolveProfile(steamId);
    const [summary, averageCompletionPercentage] = await Promise.all([
      this.profileGamesDataService.getProfileGameSummary(profile.id),
      this.profileGamesDataService.getAverageCompletionPercentage(profile.id),
    ]);

    return {
      steamId: profile.steamId,
      personaName: profile.personaName,
      avatarUrl: profile.avatarUrl,
      visibilityState: profile.visibilityState,
      isPrivate: profile.isPrivate,
      lastSyncedAt: toIsoOrNull(profile.lastSyncedAt),
      totalGames: summary.totalGames,
      completedGames: summary.completedGames,
      totalAchievements: summary.totalAchievements,
      unlockedAchievements: summary.unlockedAchievements,
      remainingAchievements:
        summary.totalAchievements - summary.unlockedAchievements,
      averageCompletionPercentage: roundPercentage(averageCompletionPercentage),
    };
  }

  async resolveProfile(steamId: string): Promise<SteamProfile> {
    const profile = await this.steamProfilesDataService.findBySteamId(steamId);

    if (profile === null) {
      throw new NotFoundException(`Steam profile ${steamId} was not found`);
    }

    return profile;
  }

  async findProfileBySteamId(steamId: string): Promise<SteamProfile | null> {
    return this.steamProfilesDataService.findBySteamId(steamId);
  }

  private mapProfileDetail(profile: SteamProfile): ProfileDetailResponseDto {
    return {
      id: profile.id,
      steamId: profile.steamId,
      personaName: profile.personaName,
      avatarUrl: profile.avatarUrl,
      profileUrl: profile.profileUrl,
      visibilityState: profile.visibilityState,
      isPrivate: profile.isPrivate,
      lastSyncedAt: toIsoOrNull(profile.lastSyncedAt),
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}

function toIsoOrNull(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

function roundPercentage(value: number): number {
  return Math.round(value * 100) / 100;
}
