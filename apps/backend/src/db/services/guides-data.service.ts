import { Injectable } from '@nestjs/common';

import {
  GuidesRepository,
  type CreateGuideInput,
  type Guide,
  type GuideListFilters,
  type GuideStatus,
  type GuideVisibility,
  type GuideWithAuthor,
  type NewGuide,
  type UpdateGuideInput,
} from '../repositories/guides.repository';

export type {
  CreateGuideInput,
  Guide,
  GuideListFilters,
  GuideStatus,
  GuideVisibility,
  GuideWithAuthor,
  NewGuide,
  UpdateGuideInput,
} from '../repositories/guides.repository';

@Injectable()
export class GuidesDataService {
  constructor(private readonly guidesRepository: GuidesRepository) {}

  async findPublicGuidesForGame(
    filters: GuideListFilters,
  ): Promise<GuideWithAuthor[]> {
    return this.guidesRepository.findPublicGuidesForGame(filters);
  }

  async countPublicGuidesForGame(
    filters: Pick<GuideListFilters, 'steamAppId' | 'search'>,
  ): Promise<number> {
    return this.guidesRepository.countPublicGuidesForGame(filters);
  }

  async findPublicGuideBySlug(
    steamAppId: number,
    slug: string,
  ): Promise<GuideWithAuthor | null> {
    return this.guidesRepository.findPublicGuideBySlug(steamAppId, slug);
  }

  async findById(id: string): Promise<Guide | null> {
    return this.guidesRepository.findById(id);
  }

  async findByIdWithAuthor(id: string): Promise<GuideWithAuthor | null> {
    return this.guidesRepository.findByIdWithAuthor(id);
  }

  async findByAuthorUserId(authorUserId: string): Promise<GuideWithAuthor[]> {
    return this.guidesRepository.findByAuthorUserId(authorUserId);
  }

  async slugExists(
    steamAppId: number,
    slug: string,
    excludeGuideId?: string,
  ): Promise<boolean> {
    return this.guidesRepository.slugExists(steamAppId, slug, excludeGuideId);
  }

  async create(input: CreateGuideInput): Promise<Guide> {
    return this.guidesRepository.create(input);
  }

  async update(id: string, input: UpdateGuideInput): Promise<Guide | null> {
    return this.guidesRepository.update(id, input);
  }
}
