import { Injectable } from '@nestjs/common';

import {
  GuideCommentsRepository,
  type GuideComment,
  type GuideCommentWithAuthor,
  type CommentStatus,
} from '../repositories/guide-comments.repository';

export type {
  CommentAuthorRow,
  CommentStatus,
  GuideComment,
  GuideCommentWithAuthor,
} from '../repositories/guide-comments.repository';

@Injectable()
export class GuideCommentsDataService {
  constructor(private readonly guideCommentsRepository: GuideCommentsRepository) {}

  async create(input: {
    guideId: string;
    userId: string;
    body: string;
  }): Promise<GuideCommentWithAuthor> {
    return this.guideCommentsRepository.create(input);
  }

  async findById(id: string): Promise<GuideComment | null> {
    return this.guideCommentsRepository.findById(id);
  }

  async findVisibleByGuideId(guideId: string): Promise<GuideCommentWithAuthor[]> {
    return this.guideCommentsRepository.findVisibleByGuideId(guideId);
  }

  async updateBody(
    id: string,
    body: string,
  ): Promise<GuideCommentWithAuthor | null> {
    return this.guideCommentsRepository.updateBody(id, body);
  }

  async setStatus(
    id: string,
    status: CommentStatus,
  ): Promise<GuideCommentWithAuthor | null> {
    return this.guideCommentsRepository.setStatus(id, status);
  }
}
