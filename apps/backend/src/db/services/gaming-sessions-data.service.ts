import { Injectable } from '@nestjs/common';

import {
  GamingSessionsRepository,
  type CreateGamingSessionInput,
  type GamingSession,
  type SessionListFilters,
  type SessionSummaryRow,
  type UpdateGamingSessionInput,
} from '../repositories/gaming-sessions.repository';

export type {
  CreateGamingSessionInput,
  GamingSession,
  SessionListFilters,
  SessionSummaryRow,
  UpdateGamingSessionInput,
} from '../repositories/gaming-sessions.repository';

@Injectable()
export class GamingSessionsDataService {
  constructor(private readonly gamingSessionsRepository: GamingSessionsRepository) {}

  async createWithHost(input: CreateGamingSessionInput): Promise<GamingSession> {
    return this.gamingSessionsRepository.createWithHost(input);
  }

  async update(
    id: string,
    input: UpdateGamingSessionInput,
  ): Promise<GamingSession | null> {
    return this.gamingSessionsRepository.update(id, input);
  }

  async findById(id: string): Promise<GamingSession | null> {
    return this.gamingSessionsRepository.findById(id);
  }

  async findSummaries(filters: SessionListFilters): Promise<SessionSummaryRow[]> {
    return this.gamingSessionsRepository.findSummaries(filters);
  }

  async countSummaries(
    filters: Omit<SessionListFilters, 'limit' | 'offset'>,
  ): Promise<number> {
    return this.gamingSessionsRepository.countSummaries(filters);
  }

  async findSummaryById(id: string): Promise<SessionSummaryRow | null> {
    return this.gamingSessionsRepository.findSummaryById(id);
  }

  async canViewPrivateSession(id: string, userId: string): Promise<boolean> {
    return this.gamingSessionsRepository.canViewPrivateSession(id, userId);
  }
}
