import { Injectable } from '@nestjs/common';

import {
  GuideSectionsRepository,
  type CreateGuideSectionInput,
  type GuideSection,
  type NewGuideSection,
  type UpdateGuideSectionInput,
} from '../repositories/guide-sections.repository';

export type {
  CreateGuideSectionInput,
  GuideSection,
  NewGuideSection,
  UpdateGuideSectionInput,
} from '../repositories/guide-sections.repository';

@Injectable()
export class GuideSectionsDataService {
  constructor(private readonly guideSectionsRepository: GuideSectionsRepository) {}

  async findByGuideId(guideId: string): Promise<GuideSection[]> {
    return this.guideSectionsRepository.findByGuideId(guideId);
  }

  async findByIdAndGuideId(
    id: string,
    guideId: string,
  ): Promise<GuideSection | null> {
    return this.guideSectionsRepository.findByIdAndGuideId(id, guideId);
  }

  async create(input: CreateGuideSectionInput): Promise<GuideSection> {
    return this.guideSectionsRepository.create(input);
  }

  async update(
    id: string,
    guideId: string,
    input: UpdateGuideSectionInput,
  ): Promise<GuideSection | null> {
    return this.guideSectionsRepository.update(id, guideId, input);
  }
}
