import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import {
  GamesDataService,
  type GlobalGameFilters,
  type GlobalGameListRow,
} from '../../db/services/games-data.service';
import {
  ProfileGamesDataService,
  type GameLibraryFilters,
  type GlobalGamePlayerFilters,
  type GlobalGamePlayerStatus,
  type GlobalGamePlayerSort,
  type PublicTrackedPlayerForGame,
  type ProfileGameWithGame,
} from '../../db/services/profile-games-data.service';
import { AchievementsDataService } from '../../db/services/achievements-data.service';
import type { GameDetailResponseDto } from './dto/game-detail-response.dto';
import type {
  GlobalGameAchievementResponseDto,
  GlobalGameAchievementsResponseDto,
  GlobalGameDetailResponseDto,
  GlobalGameItemResponseDto,
  GlobalGamePlayerResponseDto,
  GlobalGamePlayersResponseDto,
  GlobalGamesResponseDto,
} from './dto/global-game-response.dto';
import {
  type GameLibraryItemResponseDto,
  type GameLibraryResponseDto,
  type NearestCompletionsResponseDto,
} from './dto/game-library-response.dto';
import { ProfilesService } from '../profiles/profiles.service';
import type { GameLibraryQueryDto } from './dto/game-library-query.dto';
import type { GlobalGameAchievementsQueryDto } from './dto/global-game-achievements-query.dto';
import type { GlobalGamePlayersQueryDto } from './dto/global-game-players-query.dto';
import type { GlobalGameQueryDto } from './dto/global-game-query.dto';
import type { LimitQueryDto } from './dto/limit-query.dto';

@Injectable()
export class GamesService {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly profileGamesDataService: ProfileGamesDataService,
    private readonly gamesDataService: GamesDataService,
    private readonly achievementsDataService: AchievementsDataService,
  ) {}

  async getGlobalGames(query: GlobalGameQueryDto): Promise<GlobalGamesResponseDto> {
    const filters: GlobalGameFilters = {
      search: query.search,
      hasAchievements: query.hasAchievements,
      sort: query.sort,
      order: query.order,
      limit: query.limit,
      offset: query.offset,
    };
    const [items, total] = await Promise.all([
      this.gamesDataService.findGlobalGames(filters),
      this.gamesDataService.countGlobalGames(filters),
    ]);

    return {
      items: items.map(mapGlobalGameItem),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async getGlobalGame(steamAppId: number): Promise<GlobalGameDetailResponseDto> {
    assertPositiveSteamAppId(steamAppId);
    const row = await this.gamesDataService.findGlobalGameBySteamAppId(steamAppId);

    if (row === null) {
      throw new NotFoundException(`Game ${steamAppId} was not found.`);
    }

    return {
      game: {
        id: row.game.id,
        steamAppId: row.game.steamAppId,
        name: row.game.name,
        iconUrl: row.game.iconUrl,
        logoUrl: row.game.logoUrl,
        hasAchievements: row.game.hasAchievements,
      },
      stats: {
        trackedPlayers: row.trackedPlayers,
        completedPlayers: row.completedPlayers,
        totalAchievements: row.totalAchievements,
        averageCompletionPercentage: roundTwo(row.averageCompletionPercentage),
        totalPlaytimeMinutes: row.totalPlaytimeMinutes,
        averagePlaytimeMinutes: Math.round(row.averagePlaytimeMinutes),
      },
    };
  }

  async getGlobalGameAchievements(
    steamAppId: number,
    query: GlobalGameAchievementsQueryDto,
  ): Promise<GlobalGameAchievementsResponseDto> {
    await this.ensureGlobalGameExists(steamAppId);
    const filters = {
      search: query.search,
      hidden: query.hidden,
      sort: query.sort,
      order: query.order,
      limit: query.limit,
      offset: query.offset,
    };
    const [items, total] = await Promise.all([
      this.achievementsDataService.findGlobalGameAchievements(steamAppId, filters),
      this.achievementsDataService.countGlobalGameAchievements(steamAppId, filters),
    ]);

    return {
      items: items.map(mapGlobalAchievement),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async getGlobalGamePlayers(
    steamAppId: number,
    query: GlobalGamePlayersQueryDto,
  ): Promise<GlobalGamePlayersResponseDto> {
    await this.ensureGlobalGameExists(steamAppId);
    const filters: GlobalGamePlayerFilters = {
      status: query.status as GlobalGamePlayerStatus,
      sort: query.sort as GlobalGamePlayerSort,
      order: query.order,
      limit: query.limit,
      offset: query.offset,
    };
    const [items, total] = await Promise.all([
      this.profileGamesDataService.findPublicTrackedPlayersForGame(
        steamAppId,
        filters,
      ),
      this.profileGamesDataService.countPublicTrackedPlayersForGame(
        steamAppId,
        filters,
      ),
    ]);

    return {
      items: items.map(mapGlobalPlayer),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

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

  private async ensureGlobalGameExists(steamAppId: number): Promise<void> {
    assertPositiveSteamAppId(steamAppId);
    const game = await this.gamesDataService.findBySteamAppId(steamAppId);

    if (game === null) {
      throw new NotFoundException(`Game ${steamAppId} was not found.`);
    }
  }
}

function mapGlobalGameItem(row: GlobalGameListRow): GlobalGameItemResponseDto {
  return {
    id: row.game.id,
    steamAppId: row.game.steamAppId,
    name: row.game.name,
    iconUrl: row.game.iconUrl,
    logoUrl: row.game.logoUrl,
    hasAchievements: row.game.hasAchievements,
    trackedPlayers: row.trackedPlayers,
    totalAchievements: row.totalAchievements,
    averageCompletionPercentage: roundTwo(row.averageCompletionPercentage),
    completedPlayers: row.completedPlayers,
    totalPlaytimeMinutes: row.totalPlaytimeMinutes,
  };
}

function mapGlobalAchievement(row: {
  id: string;
  apiName: string;
  displayName: string | null;
  description: string | null;
  iconUrl: string | null;
  iconGrayUrl: string | null;
  hidden: boolean;
  globalPercentage: number | null;
}): GlobalGameAchievementResponseDto {
  return {
    id: row.id,
    apiName: row.apiName,
    displayName: row.displayName,
    description: row.description,
    iconUrl: row.iconUrl,
    iconGrayUrl: row.iconGrayUrl,
    hidden: row.hidden,
    globalPercentage: row.globalPercentage,
  };
}

function mapGlobalPlayer(
  row: PublicTrackedPlayerForGame,
): GlobalGamePlayerResponseDto {
  return {
    steamId: row.steamId,
    personaName: row.personaName,
    avatarUrl: row.avatarUrl,
    profileUrl: row.profileUrl,
    playtimeMinutes: row.playtimeMinutes,
    totalAchievements: row.totalAchievements,
    unlockedAchievements: row.unlockedAchievements,
    completionPercentage: row.completionPercentage,
    lastPlayedAt: toIsoOrNull(row.lastPlayedAt),
    publicSlug: row.publicSlug,
  };
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

function roundTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function assertPositiveSteamAppId(steamAppId: number): void {
  if (!Number.isInteger(steamAppId) || steamAppId <= 0) {
    throw new BadRequestException('Steam app ID must be a positive integer.');
  }
}
