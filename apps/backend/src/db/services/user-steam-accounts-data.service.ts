import { Injectable } from '@nestjs/common';

import type {
  UpsertUserSteamAccountInput,
  UserSteamAccount,
} from '../repositories/user-steam-accounts.repository';
import { UserSteamAccountsRepository } from '../repositories/user-steam-accounts.repository';

export type { UserSteamAccount } from '../repositories/user-steam-accounts.repository';

@Injectable()
export class UserSteamAccountsDataService {
  constructor(
    private readonly userSteamAccountsRepository: UserSteamAccountsRepository,
  ) {}

  async findBySteamId(steamId: string): Promise<UserSteamAccount | null> {
    return this.userSteamAccountsRepository.findBySteamId(steamId);
  }

  async findByUserAndProfileId(
    userId: string,
    steamProfileId: string,
  ): Promise<UserSteamAccount | null> {
    return this.userSteamAccountsRepository.findByUserAndProfileId(
      userId,
      steamProfileId,
    );
  }

  async findPrimaryByUserId(userId: string): Promise<UserSteamAccount | null> {
    return this.userSteamAccountsRepository.findPrimaryByUserId(userId);
  }

  async create(input: UpsertUserSteamAccountInput): Promise<UserSteamAccount> {
    return this.userSteamAccountsRepository.create(input);
  }

  async createOrRefreshPrimaryAccount(
    input: UpsertUserSteamAccountInput,
  ): Promise<UserSteamAccount> {
    return this.userSteamAccountsRepository.upsertByUserAndProfile(input);
  }

  async setPrimary(userId: string, steamProfileId: string): Promise<void> {
    await this.userSteamAccountsRepository.setPrimary(userId, steamProfileId);
  }

  async clearPrimaryForUser(userId: string): Promise<void> {
    await this.userSteamAccountsRepository.clearPrimaryForUser(userId);
  }

  async findForUser(userId: string): Promise<UserSteamAccount[]> {
    return this.userSteamAccountsRepository.findForUser(userId);
  }
}

