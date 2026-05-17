import { Injectable } from '@nestjs/common';

import {
  UserPreferencesRepository,
  type UserPreference,
} from '../repositories/user-preferences.repository';

export type { UserPreference } from '../repositories/user-preferences.repository';

@Injectable()
export class UserPreferencesDataService {
  constructor(private readonly userPreferencesRepository: UserPreferencesRepository) {}

  async findByUserId(userId: string): Promise<UserPreference | null> {
    return this.userPreferencesRepository.findByUserId(userId);
  }

  async create(userId: string): Promise<UserPreference> {
    return this.userPreferencesRepository.create(userId);
  }
}
