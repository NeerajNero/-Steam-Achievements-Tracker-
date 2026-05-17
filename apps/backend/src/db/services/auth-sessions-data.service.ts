import { Injectable } from '@nestjs/common';

import {
  AuthSessionsRepository,
  type AuthSession,
  type CreateAuthSessionInput,
} from '../repositories/auth-sessions.repository';

export { AuthSession };

@Injectable()
export class AuthSessionsDataService {
  constructor(private readonly authSessionsRepository: AuthSessionsRepository) {}

  async create(
    input: CreateAuthSessionInput,
  ): Promise<AuthSession> {
    return this.authSessionsRepository.create(input);
  }

  async findByHash(sessionTokenHash: string): Promise<AuthSession | null> {
    return this.authSessionsRepository.findByHash(sessionTokenHash);
  }

  async findLatestForUser(userId: string): Promise<AuthSession | null> {
    return this.authSessionsRepository.findLatestForUser(userId);
  }

  async revokeByHash(sessionTokenHash: string): Promise<void> {
    await this.authSessionsRepository.revokeByHash(sessionTokenHash);
  }
}
