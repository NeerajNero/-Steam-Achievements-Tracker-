import { Injectable } from '@nestjs/common';

import {
  SessionCommentsRepository,
  type SessionComment,
  type SessionCommentWithAuthor,
} from '../repositories/session-comments.repository';
import type { CommentStatus } from '../repositories/guide-comments.repository';

export type {
  SessionComment,
  SessionCommentWithAuthor,
} from '../repositories/session-comments.repository';

@Injectable()
export class SessionCommentsDataService {
  constructor(private readonly sessionCommentsRepository: SessionCommentsRepository) {}

  async create(input: {
    sessionId: string;
    userId: string;
    body: string;
  }): Promise<SessionCommentWithAuthor> {
    return this.sessionCommentsRepository.create(input);
  }

  async findById(id: string): Promise<SessionComment | null> {
    return this.sessionCommentsRepository.findById(id);
  }

  async findVisibleBySessionId(
    sessionId: string,
  ): Promise<SessionCommentWithAuthor[]> {
    return this.sessionCommentsRepository.findVisibleBySessionId(sessionId);
  }

  async updateBody(
    id: string,
    body: string,
  ): Promise<SessionCommentWithAuthor | null> {
    return this.sessionCommentsRepository.updateBody(id, body);
  }

  async setStatus(
    id: string,
    status: CommentStatus,
  ): Promise<SessionCommentWithAuthor | null> {
    return this.sessionCommentsRepository.setStatus(id, status);
  }
}
