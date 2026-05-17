import { Injectable, NotFoundException } from '@nestjs/common';

import { ProfileAchievementsDataService } from '../../db/services/profile-achievements-data.service';
import { ProfileGamesDataService } from '../../db/services/profile-games-data.service';
import { PublicProfilesDataService } from '../../db/services/public-profiles-data.service';
import type { PublicProfileSettings } from '../account/dto/account-response.dto';
import type { GameLibraryItemResponseDto } from '../games/dto/game-library-response.dto';
import type { RarestAchievementResponseDto } from '../achievements/dto/rarest-achievements-response.dto';
import type { PublicProfileResponseDto } from './dto/public-profile-response.dto';

@Injectable()
export class PublicProfilesService {
  constructor(
    private readonly publicProfilesDataService: PublicProfilesDataService,
    private readonly profileGamesDataService: ProfileGamesDataService,
    private readonly profileAchievementsDataService: ProfileAchievementsDataService,
  ) {}

  async getPublicProfileBySlug(slug: string): Promise<PublicProfileResponseDto> {
    const normalizedSlug = slug.trim().toLowerCase();
    const row =
      await this.publicProfilesDataService.findPublicBySlug(normalizedSlug);

    if (row === null || row.publicProfile.slug === null) {
      throw new NotFoundException('Public profile was not found.');
    }

    const settings = normalizePublicProfileSettings(row.publicProfile.settings);
    const [summary, averageCompletionPercentage, nearestCompletions, rarest] =
      await Promise.all([
        this.profileGamesDataService.getProfileGameSummary(
          row.steamProfile.id,
        ),
        this.profileGamesDataService.getAverageCompletionPercentage(
          row.steamProfile.id,
        ),
        this.profileGamesDataService.findNearestCompletionsWithGames(
          row.steamProfile.id,
          5,
        ),
        settings.showRarestAchievements === false
          ? Promise.resolve([])
          : this.profileAchievementsDataService.findRarestUnlockedByProfile(
              row.steamProfile.id,
              5,
            ),
      ]);

    return {
      publicProfile: {
        slug: row.publicProfile.slug,
        isPublic: row.publicProfile.isPublic,
        settings,
      },
      steamProfile: {
        steamId:
          settings.showSteamId === false ? null : row.steamProfile.steamId,
        personaName: row.steamProfile.personaName,
        avatarUrl: row.steamProfile.avatarUrl,
        profileUrl: row.steamProfile.profileUrl,
        isPrivate: row.steamProfile.isPrivate,
        lastSyncedAt: toIsoOrNull(row.steamProfile.lastSyncedAt),
      },
      summary: {
        steamId: settings.showSteamId === false ? '' : row.steamProfile.steamId,
        personaName: row.steamProfile.personaName,
        avatarUrl: row.steamProfile.avatarUrl,
        visibilityState: row.steamProfile.visibilityState,
        isPrivate: row.steamProfile.isPrivate,
        lastSyncedAt: toIsoOrNull(row.steamProfile.lastSyncedAt),
        totalGames: summary.totalGames,
        completedGames: summary.completedGames,
        totalAchievements: summary.totalAchievements,
        unlockedAchievements: summary.unlockedAchievements,
        remainingAchievements:
          summary.totalAchievements - summary.unlockedAchievements,
        averageCompletionPercentage:
          Math.round(averageCompletionPercentage * 100) / 100,
      },
      nearestCompletions: nearestCompletions.map(mapProfileGameWithGame),
      rarestAchievements: rarest.map(mapRarestAchievement),
    };
  }
}

function normalizePublicProfileSettings(value: unknown): PublicProfileSettings {
  if (!isRecord(value)) {
    return {};
  }

  const settings: PublicProfileSettings = {};

  if (typeof value.showRarestAchievements === 'boolean') {
    settings.showRarestAchievements = value.showRarestAchievements;
  }

  if (typeof value.showRecentSyncs === 'boolean') {
    settings.showRecentSyncs = value.showRecentSyncs;
  }

  if (typeof value.showSteamId === 'boolean') {
    settings.showSteamId = value.showSteamId;
  }

  return settings;
}

function mapProfileGameWithGame(row: {
  profileGame: {
    playtimeMinutes: number;
    playtimeTwoWeeksMinutes: number;
    totalAchievements: number;
    unlockedAchievements: number;
    completionPercentage: number;
    lastPlayedAt: Date | null;
    lastSyncedAt: Date | null;
  };
  game: {
    steamAppId: number;
    name: string;
    iconUrl: string | null;
    logoUrl: string | null;
    hasAchievements: boolean;
  };
  achievementMetadataCount?: number;
  knownUnlockStateCount?: number;
}): GameLibraryItemResponseDto {
  const achievementMetadataCount =
    row.achievementMetadataCount ?? row.profileGame.totalAchievements;
  const knownUnlockStateCount =
    row.knownUnlockStateCount ?? row.profileGame.totalAchievements;
  const achievementDataState =
    achievementMetadataCount > 0 && knownUnlockStateCount > 0
      ? 'unlock_state_synced'
      : achievementMetadataCount > 0
        ? 'metadata_only'
        : 'not_synced';
  const totalAchievements =
    achievementMetadataCount > 0
      ? achievementMetadataCount
      : row.profileGame.totalAchievements;
  const remainingAchievements =
    achievementDataState === 'metadata_only'
      ? 0
      : Math.max(totalAchievements - row.profileGame.unlockedAchievements, 0);

  return {
    steamAppId: row.game.steamAppId,
    name: row.game.name,
    iconUrl: row.game.iconUrl,
    logoUrl: row.game.logoUrl,
    hasAchievements: row.game.hasAchievements,
    playtimeMinutes: row.profileGame.playtimeMinutes,
    playtimeTwoWeeksMinutes: row.profileGame.playtimeTwoWeeksMinutes,
    totalAchievements,
    achievementMetadataCount,
    knownUnlockStateCount,
    achievementDataState,
    unlockedAchievements: row.profileGame.unlockedAchievements,
    remainingAchievements,
    completionPercentage: row.profileGame.completionPercentage,
    lastPlayedAt: toIsoOrNull(row.profileGame.lastPlayedAt),
    lastSyncedAt: toIsoOrNull(row.profileGame.lastSyncedAt),
  };
}

function mapRarestAchievement(row: {
  profileAchievement: {
    unlockedAt: Date | null;
    lastSyncedAt: Date | null;
  };
  achievement: {
    steamAppId: number;
    apiName: string;
    displayName: string | null;
    description: string | null;
    iconUrl: string | null;
    iconGrayUrl: string | null;
    globalPercentage: number | null;
    hidden: boolean;
  };
}): RarestAchievementResponseDto {
  return {
    steamAppId: row.achievement.steamAppId,
    apiName: row.achievement.apiName,
    displayName: row.achievement.displayName,
    description: row.achievement.description,
    iconUrl: row.achievement.iconUrl,
    iconGrayUrl: row.achievement.iconGrayUrl,
    globalPercentage: row.achievement.globalPercentage ?? 0,
    hidden: row.achievement.hidden,
    unlockedAt: toIsoOrNull(row.profileAchievement.unlockedAt),
    lastSyncedAt: toIsoOrNull(row.profileAchievement.lastSyncedAt),
  };
}

function toIsoOrNull(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
