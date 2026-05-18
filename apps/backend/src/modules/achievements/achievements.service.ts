import { Injectable, NotFoundException } from '@nestjs/common';

import {
  ProfileAchievementsDataService,
  type AchievementWithUnlockState,
  type RarestUnlockedAchievement,
} from '../../db/services/profile-achievements-data.service';
import { ProfileGamesDataService } from '../../db/services/profile-games-data.service';
import { ProfilesService } from '../profiles/profiles.service';
import type { AchievementListQueryDto } from './dto/achievement-list-query.dto';
import type {
  AchievementsResponseDto,
  AchievementUnlockState,
  AchievementWithUnlockStateResponseDto,
} from './dto/achievements-response.dto';
import type {
  RarestAchievementResponseDto,
  RarestAchievementsResponseDto,
} from './dto/rarest-achievements-response.dto';
import type { LimitQueryDto } from '../games/dto/limit-query.dto';

@Injectable()
export class AchievementsService {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly profileGamesDataService: ProfileGamesDataService,
    private readonly profileAchievementsDataService: ProfileAchievementsDataService,
  ) {}

  async getGameAchievements(
    steamId: string,
    steamAppId: number,
    query: AchievementListQueryDto,
  ): Promise<AchievementsResponseDto> {
    const profile = await this.profilesService.resolveProfile(steamId);
    const profileGame =
      await this.profileGamesDataService.findProfileGameBySteamAppId(
        profile.id,
        steamAppId,
      );

    if (profileGame === null) {
      throw new NotFoundException(
        `Game ${steamAppId} was not found for Steam profile ${steamId}`,
      );
    }

    const achievements =
      await this.profileAchievementsDataService.findAchievementsWithUnlockState(
        profile.id,
        steamAppId,
        {
          status: query.status,
          sort: query.sort,
          order: query.order,
        },
      );

    return {
      steamId: profile.steamId,
      steamAppId,
      total: achievements.length,
      items: achievements.map(mapAchievementWithUnlockState),
    };
  }

  async getRarestUnlockedAchievements(
    steamId: string,
    query: LimitQueryDto,
  ): Promise<RarestAchievementsResponseDto> {
    const profile = await this.profilesService.resolveProfile(steamId);
    const items =
      await this.profileAchievementsDataService.findRarestUnlockedByProfile(
        profile.id,
        query.limit,
      );

    return {
      steamId: profile.steamId,
      items: items.map(mapRarestAchievement),
    };
  }
}

function mapAchievementWithUnlockState(
  row: AchievementWithUnlockState,
): AchievementWithUnlockStateResponseDto {
  return {
    id: row.achievement.id,
    apiName: row.achievement.apiName,
    displayName: row.achievement.displayName,
    description: row.achievement.description,
    iconUrl: row.achievement.iconUrl,
    iconGrayUrl: row.achievement.iconGrayUrl,
    globalPercentage: row.achievement.globalPercentage,
    hidden: row.achievement.hidden,
    achieved: row.profileAchievement?.achieved ?? false,
    unlockState: getUnlockState(row),
    unlockedAt: toIsoOrNull(row.profileAchievement?.unlockedAt ?? null),
    lastSyncedAt: toIsoOrNull(row.profileAchievement?.lastSyncedAt ?? null),
  };
}

function getUnlockState(
  row: AchievementWithUnlockState,
): AchievementUnlockState {
  if (row.profileAchievement === null) {
    return 'unknown';
  }

  return row.profileAchievement.achieved ? 'unlocked' : 'locked';
}

function mapRarestAchievement(
  row: RarestUnlockedAchievement,
): RarestAchievementResponseDto {
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
