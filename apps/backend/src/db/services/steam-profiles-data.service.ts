import { Injectable } from '@nestjs/common';

import {
  SteamProfilesRepository,
  type SteamProfile,
  type UpdateSteamProfileSyncStateInput,
  type UpsertSteamProfileInput,
} from '../repositories/steam-profiles.repository';

export type {
  NewSteamProfile,
  SteamProfile,
  UpdateSteamProfileSyncStateInput,
  UpsertSteamProfileInput,
} from '../repositories/steam-profiles.repository';

@Injectable()
export class SteamProfilesDataService {
  constructor(private readonly steamProfilesRepository: SteamProfilesRepository) {}

  async findBySteamId(steamId: string): Promise<SteamProfile | null> {
    return this.steamProfilesRepository.findBySteamId(steamId);
  }

  async findById(id: string): Promise<SteamProfile | null> {
    return this.steamProfilesRepository.findById(id);
  }

  async upsertProfile(input: UpsertSteamProfileInput): Promise<SteamProfile> {
    return this.steamProfilesRepository.upsertProfile(input);
  }

  async updateSyncState(
    id: string,
    input: UpdateSteamProfileSyncStateInput,
  ): Promise<SteamProfile | null> {
    return this.steamProfilesRepository.updateSyncState(id, input);
  }
}
