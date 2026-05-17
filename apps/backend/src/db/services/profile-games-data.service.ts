import { Injectable } from '@nestjs/common';

import {
  ProfileGamesRepository,
  type GameLibraryFilters,
  type GlobalGamePlayerFilters,
  type ProfileGame,
  type ProfileGameFilters,
  type ProfileGameSummary,
  type ProfileGameWithGame,
  type PublicTrackedPlayerForGame,
  type UpsertOwnedGameProgressInput,
  type UpsertProfileGameInput,
  type UpsertRecentGameProgressInput,
} from '../repositories/profile-games.repository';

export type {
  GameLibraryFilters,
  GameLibrarySort,
  GameLibraryStatus,
  GlobalGamePlayerFilters,
  GlobalGamePlayerSort,
  GlobalGamePlayerStatus,
  NewProfileGame,
  ProfileGame,
  ProfileGameFilters,
  ProfileGameSummary,
  ProfileGameWithGame,
  PublicTrackedPlayerForGame,
  SortOrder,
  UpsertOwnedGameProgressInput,
  UpsertProfileGameInput,
  UpsertRecentGameProgressInput,
} from '../repositories/profile-games.repository';

@Injectable()
export class ProfileGamesDataService {
  constructor(private readonly profileGamesRepository: ProfileGamesRepository) {}

  async upsertProfileGame(
    input: UpsertProfileGameInput,
  ): Promise<ProfileGame> {
    return this.profileGamesRepository.upsertProfileGame(input);
  }

  async upsertOwnedGameProgressPreservingAchievementStats(
    input: UpsertOwnedGameProgressInput,
  ): Promise<ProfileGame> {
    return this.profileGamesRepository
      .upsertOwnedGameProgressPreservingAchievementStats(input);
  }

  async upsertRecentGameProgressPreservingAchievementStats(
    input: UpsertRecentGameProgressInput,
  ): Promise<ProfileGame> {
    return this.profileGamesRepository
      .upsertRecentGameProgressPreservingAchievementStats(input);
  }

  async findByProfileId(
    profileId: string,
    filters: ProfileGameFilters = {},
  ): Promise<ProfileGame[]> {
    return this.profileGamesRepository.findByProfileId(profileId, filters);
  }

  async findNearestCompletions(
    profileId: string,
    limit: number,
  ): Promise<ProfileGame[]> {
    return this.profileGamesRepository.findNearestCompletions(profileId, limit);
  }

  async findNearestCompletionsWithGames(
    profileId: string,
    limit: number,
  ): Promise<ProfileGameWithGame[]> {
    return this.profileGamesRepository.findNearestCompletionsWithGames(
      profileId,
      limit,
    );
  }

  async findProfileGameBySteamAppId(
    profileId: string,
    steamAppId: number,
  ): Promise<ProfileGameWithGame | null> {
    return this.profileGamesRepository.findProfileGameBySteamAppId(
      profileId,
      steamAppId,
    );
  }

  async findProfileGamesForAchievementSync(
    profileId: string,
    steamAppIds?: number[],
  ): Promise<ProfileGameWithGame[]> {
    return this.profileGamesRepository.findProfileGamesForAchievementSync(
      profileId,
      steamAppIds,
    );
  }

  async findLibraryByProfileId(
    profileId: string,
    filters: GameLibraryFilters,
  ): Promise<ProfileGameWithGame[]> {
    return this.profileGamesRepository.findLibraryByProfileId(profileId, filters);
  }

  async countLibraryByProfileId(
    profileId: string,
    filters: Pick<GameLibraryFilters, 'search' | 'status'>,
  ): Promise<number> {
    return this.profileGamesRepository.countLibraryByProfileId(profileId, filters);
  }

  async getProfileGameSummary(profileId: string): Promise<ProfileGameSummary> {
    return this.profileGamesRepository.getProfileGameSummary(profileId);
  }

  async getAverageCompletionPercentage(profileId: string): Promise<number> {
    return this.profileGamesRepository.getAverageCompletionPercentage(profileId);
  }

  async findPublicTrackedPlayersForGame(
    steamAppId: number,
    filters: GlobalGamePlayerFilters,
  ): Promise<PublicTrackedPlayerForGame[]> {
    return this.profileGamesRepository.findPublicTrackedPlayersForGame(
      steamAppId,
      filters,
    );
  }

  async countPublicTrackedPlayersForGame(
    steamAppId: number,
    filters: Pick<GlobalGamePlayerFilters, 'status'>,
  ): Promise<number> {
    return this.profileGamesRepository.countPublicTrackedPlayersForGame(
      steamAppId,
      filters,
    );
  }
}
