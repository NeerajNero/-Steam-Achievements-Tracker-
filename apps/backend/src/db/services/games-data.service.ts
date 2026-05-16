import { Injectable } from '@nestjs/common';

import {
  GamesRepository,
  type Game,
  type UpsertGameInput,
  type UpsertOwnedGameInput,
} from '../repositories/games.repository';

export type {
  Game,
  NewGame,
  UpsertGameInput,
  UpsertOwnedGameInput,
} from '../repositories/games.repository';

@Injectable()
export class GamesDataService {
  constructor(private readonly gamesRepository: GamesRepository) {}

  async findBySteamAppId(steamAppId: number): Promise<Game | null> {
    return this.gamesRepository.findBySteamAppId(steamAppId);
  }

  async findById(id: string): Promise<Game | null> {
    return this.gamesRepository.findById(id);
  }

  async upsertGame(input: UpsertGameInput): Promise<Game> {
    return this.gamesRepository.upsertGame(input);
  }

  async upsertOwnedGame(input: UpsertOwnedGameInput): Promise<Game> {
    return this.gamesRepository.upsertOwnedGame(input);
  }
}
