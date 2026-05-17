import { Injectable } from '@nestjs/common';

import {
  ProfileShowcaseItemsRepository,
  type ProfileShowcaseItem,
  type ProfileShowcaseItemType,
  type ProfileShowcaseItemWithDetails,
  type ProfileShowcaseVisibility,
  type ReplaceProfileShowcaseItemInput,
} from '../repositories/profile-showcase-items.repository';

export type {
  ProfileShowcaseItem,
  ProfileShowcaseItemType,
  ProfileShowcaseItemWithDetails,
  ProfileShowcaseVisibility,
  ReplaceProfileShowcaseItemInput,
} from '../repositories/profile-showcase-items.repository';

@Injectable()
export class ProfileShowcaseItemsDataService {
  constructor(
    private readonly profileShowcaseItemsRepository: ProfileShowcaseItemsRepository,
  ) {}

  async findPublicBySteamProfileId(
    steamProfileId: string,
  ): Promise<ProfileShowcaseItemWithDetails[]> {
    return this.profileShowcaseItemsRepository.findBySteamProfileId(
      steamProfileId,
      { publicOnly: true },
    );
  }

  async findBySteamProfileId(
    steamProfileId: string,
  ): Promise<ProfileShowcaseItemWithDetails[]> {
    return this.profileShowcaseItemsRepository.findBySteamProfileId(
      steamProfileId,
    );
  }

  async replaceForProfile(input: {
    steamProfileId: string;
    ownerUserId: string;
    items: ReplaceProfileShowcaseItemInput[];
  }): Promise<ProfileShowcaseItem[]> {
    return this.profileShowcaseItemsRepository.replaceForProfile(input);
  }

  async findInvalidEarnedBadgeIds(
    steamProfileId: string,
    profileBadgeIds: string[],
  ): Promise<string[]> {
    return this.profileShowcaseItemsRepository.findInvalidEarnedBadgeIds(
      steamProfileId,
      profileBadgeIds,
    );
  }

  async findInvalidMilestoneIds(
    steamProfileId: string,
    milestoneIds: string[],
  ): Promise<string[]> {
    return this.profileShowcaseItemsRepository.findInvalidMilestoneIds(
      steamProfileId,
      milestoneIds,
    );
  }

  async findInvalidAchievementIds(
    steamProfileId: string,
    profileAchievementIds: string[],
  ): Promise<string[]> {
    return this.profileShowcaseItemsRepository.findInvalidAchievementIds(
      steamProfileId,
      profileAchievementIds,
    );
  }

  async findInvalidGuideIds(
    ownerUserId: string,
    guidesToShowcase: Array<{ id: string; visibility: ProfileShowcaseVisibility }>,
  ): Promise<string[]> {
    return this.profileShowcaseItemsRepository.findInvalidGuideIds(
      ownerUserId,
      guidesToShowcase,
    );
  }

  async findInvalidGamingSessionIds(
    ownerUserId: string,
    sessionsToShowcase: Array<{ id: string; visibility: ProfileShowcaseVisibility }>,
  ): Promise<string[]> {
    return this.profileShowcaseItemsRepository.findInvalidGamingSessionIds(
      ownerUserId,
      sessionsToShowcase,
    );
  }
}
