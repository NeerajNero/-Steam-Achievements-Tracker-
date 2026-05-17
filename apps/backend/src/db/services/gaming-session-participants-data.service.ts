import { Injectable } from '@nestjs/common';

import {
  GamingSessionParticipantsRepository,
  type GamingSessionParticipant,
  type ParticipantWithUser,
} from '../repositories/gaming-session-participants.repository';

export type {
  GamingSessionParticipant,
  ParticipantWithUser,
} from '../repositories/gaming-session-participants.repository';

@Injectable()
export class GamingSessionParticipantsDataService {
  constructor(
    private readonly gamingSessionParticipantsRepository: GamingSessionParticipantsRepository,
  ) {}

  async findBySessionId(sessionId: string): Promise<ParticipantWithUser[]> {
    return this.gamingSessionParticipantsRepository.findBySessionId(sessionId);
  }

  async findBySessionAndUser(
    sessionId: string,
    userId: string,
  ): Promise<GamingSessionParticipant | null> {
    return this.gamingSessionParticipantsRepository.findBySessionAndUser(
      sessionId,
      userId,
    );
  }

  async join(
    sessionId: string,
    userId: string,
  ): Promise<GamingSessionParticipant> {
    return this.gamingSessionParticipantsRepository.join(sessionId, userId);
  }

  async leave(sessionId: string, userId: string): Promise<boolean> {
    return this.gamingSessionParticipantsRepository.leave(sessionId, userId);
  }
}
