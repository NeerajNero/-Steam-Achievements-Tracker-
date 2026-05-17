import { Injectable } from '@nestjs/common';

import {
  PublicProfilesRepository,
  type PublicProfile,
} from '../repositories/public-profiles.repository';

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

  async create(input: {
    userId: string;
    steamProfileId: string;
    slug?: string | null;
    isPublic?: boolean;
  }): Promise<PublicProfile> {
    return this.publicProfilesRepository.create(input);
  }
}
