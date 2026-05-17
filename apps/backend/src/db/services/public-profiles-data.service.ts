import { Injectable } from '@nestjs/common';

import {
  PublicProfilesRepository,
  type PublicProfile,
  type PublicProfileWithSteamProfile,
} from '../repositories/public-profiles.repository';
import type { PublicProfileSettings } from '../schema';

export type { PublicProfile } from '../repositories/public-profiles.repository';

@Injectable()
export class PublicProfilesDataService {
  constructor(private readonly publicProfilesRepository: PublicProfilesRepository) {}

  async findByUserAndProfileId(
    userId: string,
    steamProfileId: string,
  ): Promise<PublicProfile | null> {
    return this.publicProfilesRepository.findByUserAndProfileId(
      userId,
      steamProfileId,
    );
  }

  async findPrimaryByUserId(userId: string): Promise<PublicProfile | null> {
    return this.publicProfilesRepository.findPrimaryByUserId(userId);
  }

  async findBySlug(slug: string): Promise<PublicProfile | null> {
    return this.publicProfilesRepository.findBySlug(slug);
  }

  async findPublicBySlug(
    slug: string,
  ): Promise<PublicProfileWithSteamProfile | null> {
    return this.publicProfilesRepository.findPublicBySlug(slug);
  }

  async create(input: {
    userId: string;
    steamProfileId: string;
    slug?: string | null;
    isPublic?: boolean;
    settings?: PublicProfileSettings;
  }): Promise<PublicProfile> {
    return this.publicProfilesRepository.create(input);
  }

  async updateById(
    id: string,
    input: {
      slug?: string | null;
      isPublic?: boolean;
      settings?: PublicProfileSettings;
    },
  ): Promise<PublicProfile | null> {
    return this.publicProfilesRepository.updateById(id, input);
  }

  async updateByUserAndProfileId(
    userId: string,
    steamProfileId: string,
    input: {
      slug?: string | null;
      isPublic?: boolean;
      settings?: PublicProfileSettings;
    },
  ): Promise<PublicProfile | null> {
    return this.publicProfilesRepository.updateByUserAndProfileId(
      userId,
      steamProfileId,
      input,
    );
  }
}
