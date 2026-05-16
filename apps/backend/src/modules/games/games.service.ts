import { Injectable, NotFoundException } from '@nestjs/common';

import {
  ProfileGamesDataService,
  type GameLibraryFilters,
  type ProfileGameWithGame,
} from '../../db/services/profile-games-data.service';
import type { GameDetailResponseDto } from './dto/game-detail-response.dto';
import {
  type GameLibraryItemResponseDto,
  type GameLibraryResponseDto,
  type NearestCompletionsResponseDto,
} from './dto/game-library-response.dto';
import { ProfilesService } from '../profiles/profiles.service';
import type { GameLibraryQueryDto } from './dto/game-library-query.dto';
import type { LimitQueryDto } from './dto/limit-query.dto';

@Injectable()
export class GamesService {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly profileGamesDataService: ProfileGamesDataService,
  ) {}

  async getLibrary(
    steamId: string,
    query: GameLibraryQueryDto,
  ): Promise<GameLibraryResponseDto> {
    const profile = await this.profilesService.resolveProfile(steamId);
    const filters: GameLibraryFilters = {
      search: query.search,
      status: query.status,
      sort: query.sort,
      order: query.order,
      limit: query.limit,
      offset: query.offset,
    };
    const [items, total] = await Promise.all([
      this.profileGamesDataService.findLibraryByProfileId(profile.id, filters),
      this.profileGamesDataService.countLibraryByProfileId(profile.id, filters),
    ]);

    return {
      steamId: profile.steamId,
      total,
      limit: query.limit,
      offset: query.offset,
      items: items.map(mapProfileGameWithGame),
    };
  }

  async getNearestCompletions(
    steamId: string,
    query: LimitQueryDto,
  ): Promise<NearestCompletionsResponseDto> {
    const profile = await this.profilesService.resolveProfile(steamId);
    const items =
      await this.profileGamesDataService.findNearestCompletionsWithGames(
        profile.id,
        query.limit,
      );

    return {
      steamId: profile.steamId,
      items: items.map(mapProfileGameWithGame),
    };
  }

  async getGameDetail(
    steamId: string,
    steamAppId: number,
  ): Promise<GameDetailResponseDto> {
    const profile = await this.profilesService.resolveProfile(steamId);
    const row = await this.profileGamesDataService.findProfileGameBySteamAppId(
      profile.id,
      steamAppId,
    );

    if (row === null) {
      throw new NotFoundException(
        `Game ${steamAppId} was not found for Steam profile ${steamId}`,
      );
    }

    const item = mapProfileGameWithGame(row);

    return {
      steamId: profile.steamId,
      steamAppId: item.steamAppId,
      name: item.name,
      iconUrl: item.iconUrl,
      logoUrl: item.logoUrl,
      hasAchievements: item.hasAchievements,
      playtimeMinutes: item.playtimeMinutes,
      playtimeTwoWeeksMinutes: item.playtimeTwoWeeksMinutes,
      totalAchievements: item.totalAchievements,
      unlockedAchievements: item.unlockedAchievements,
      remainingAchievements: item.remainingAchievements,
      completionPercentage: item.completionPercentage,
      lastPlayedAt: item.lastPlayedAt,
      lastSyncedAt: item.lastSyncedAt,
      achievementsSummary: {
        total: item.totalAchievements,
        unlocked: item.unlockedAchievements,
        locked: item.remainingAchievements,
      },
    };
  }
}

function mapProfileGameWithGame(
  row: ProfileGameWithGame,
): GameLibraryItemResponseDto {
  return {
    steamAppId: row.game.steamAppId,
    name: row.game.name,
    iconUrl: row.game.iconUrl,
    logoUrl: row.game.logoUrl,
    hasAchievements: row.game.hasAchievements,
    playtimeMinutes: row.profileGame.playtimeMinutes,
    playtimeTwoWeeksMinutes: row.profileGame.playtimeTwoWeeksMinutes,
    totalAchievements: row.profileGame.totalAchievements,
    unlockedAchievements: row.profileGame.unlockedAchievements,
    remainingAchievements:
      row.profileGame.totalAchievements - row.profileGame.unlockedAchievements,
    completionPercentage: row.profileGame.completionPercentage,
    lastPlayedAt: toIsoOrNull(row.profileGame.lastPlayedAt),
    lastSyncedAt: toIsoOrNull(row.profileGame.lastSyncedAt),
  };
}

function toIsoOrNull(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}
