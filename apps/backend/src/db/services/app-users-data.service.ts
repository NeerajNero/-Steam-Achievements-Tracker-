import { Injectable } from '@nestjs/common';

import {
  AppUsersRepository,
  type AppUser,
  type CreateAppUserInput,
  type UpdateAppUserInput,
} from '../repositories/app-users.repository';

export type {
  AppUser,
  CreateAppUserInput,
  UpdateAppUserInput,
} from '../repositories/app-users.repository';

@Injectable()
export class AppUsersDataService {
  constructor(private readonly appUsersRepository: AppUsersRepository) {}

  async findById(id: string): Promise<AppUser | null> {
    return this.appUsersRepository.findById(id);
  }

  async create(input: CreateAppUserInput): Promise<AppUser> {
    return this.appUsersRepository.create(input);
  }

  async update(id: string, input: UpdateAppUserInput): Promise<AppUser | null> {
    return this.appUsersRepository.update(id, input);
  }

  async touchLastLogin(id: string): Promise<AppUser | null> {
    return this.appUsersRepository.touchLastLogin(id);
  }
}

